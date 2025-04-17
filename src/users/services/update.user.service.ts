import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Users } from '../models/user';
import { UpdateUserInput } from '../dto/inputs/update.user.input';
import { UserView } from '../dto/views/user.view';
import { GQLThrowType, ThrowGQL } from '@app/gqlerr';
import { parseToView } from '../models/parser';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GetEligibilityService } from '../../MX/services/eligibility/get.eligibility.service';
import { CreateRecordedAnswerInput } from 'src/MX/dto/recorded/create.recorded.input';
import { Eligibility } from 'src/MX/models/eligibility';
import { UtilsService } from 'src/MX/services/utils/utils.service';

@Injectable()
export class UpdateUserService {
  // Define specific timestamps for the three iterations
  private readonly iterationTimes = [
    new Date('2025-04-15T04:00:00'), // Iteration 1 starts at 4:00
    new Date('2025-04-15T05:30:00'), // Iteration 2 starts at 5:30
    new Date('2025-04-15T07:00:00'), // Iteration 3 starts at 7:00
  ];

  // Define end times for each iteration
  private readonly iterationEndTimes = [
    new Date('2025-04-15T05:29:59'), // Iteration 1 ends at 5:29:59
    new Date('2025-04-15T06:59:59'), // Iteration 2 ends at 6:59:59
    new Date('2025-04-15T23:59:59'), // Iteration 3 ends at end of day
  ];

  // Worker counts for each iteration
  private readonly workersPerIteration = [3, 6, 9]; // Target worker counts per iteration
  private readonly logger = new Logger(UpdateUserService.name);

  constructor(
    @InjectModel(Users.name)
    private userModel: Model<Users>,
    @InjectModel(Eligibility.name)
    private eligibilityModel: Model<Eligibility>,
    private readonly getEligibilityService: GetEligibilityService,
    private readonly utilsService: UtilsService, // Inject the UtilsService
  ) {}

  async updateUser(input: UpdateUserInput): Promise<UserView> {
    try {
      const id = input.id;
      delete input.id;
      const user = await this.userModel.findByIdAndUpdate(
        id,
        { $set: input },
        { new: true },
      );
      if (!user) {
        throw new ThrowGQL('User not found', GQLThrowType.NOT_FOUND);
      }
      return parseToView(user);
    } catch (error) {
      throw new ThrowGQL(error, GQLThrowType.UNPROCESSABLE);
    }
  }

  async userHasDoneTask(
    input: CreateRecordedAnswerInput,
    userId: string,
  ): Promise<UserView> {
    try {
      const { taskId, answer } = input;
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new ThrowGQL('User not found', GQLThrowType.NOT_FOUND);
      }

      // Check if the task is already in completedTasks
      if (!user.completedTasks.some((t) => t.taskId === taskId)) {
        // Use findByIdAndUpdate with $push to add to completedTasks array
        const updatedUser = await this.userModel.findByIdAndUpdate(
          userId,
          { $push: { completedTasks: { taskId, answer } } },
          { new: true },
        );
        return parseToView(updatedUser);
      }

      return parseToView(user);
    } catch (error) {
      throw new ThrowGQL(error, GQLThrowType.UNPROCESSABLE);
    }
  }

  /**
   * Determine which iteration we are currently in based on the current time
   */
  private getCurrentIteration(): number {
    const now = new Date();

    // Check which iteration we're in
    if (now >= this.iterationTimes[2]) {
      return 3; // We're in iteration 3 (starting from 7:00)
    } else if (now >= this.iterationTimes[1]) {
      return 2; // We're in iteration 2 (5:30 - 6:59)
    } else if (now >= this.iterationTimes[0]) {
      return 1; // We're in iteration 1 (4:00 - 5:29)
    } else {
      return 0; // We haven't started any iterations yet
    }
  }

  /**
   * Get workers who should be evaluated in the current iteration
   * based on creation time within iteration bounds
   */
  private async getWorkersForCurrentIteration(): Promise<Users[]> {
    const currentIteration = this.getCurrentIteration();
    if (currentIteration === 0) {
      return []; // No iterations have started yet
    }

    // Get start and end time for current iteration
    const startTime = this.iterationTimes[currentIteration - 1];
    const endTime = this.iterationEndTimes[currentIteration - 1];

    this.logger.log(
      `Getting workers for iteration ${currentIteration} (${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()})`,
    );

    // Get workers created within this iteration timeframe
    const workersForIteration = await this.userModel
      .find({
        role: 'worker',
        createdAt: {
          $gte: startTime,
          $lte: endTime,
        },
      })
      .limit(this.workersPerIteration[currentIteration - 1])
      .exec();

    this.logger.log(
      `Found ${workersForIteration.length} workers for iteration ${currentIteration}`,
    );

    return workersForIteration;
  }

  /**
   * Get workers from all previous iterations up to current
   */
  private async getWorkersForAllCompletedIterations(): Promise<Users[]> {
    const currentIteration = this.getCurrentIteration();
    if (currentIteration === 0) {
      return []; // No iterations have started yet
    }

    // Get the earliest start time for iteration 1
    const earliestStartTime = this.iterationTimes[0];

    // Get the end time for the current iteration
    const endTime = this.iterationEndTimes[currentIteration - 1];

    this.logger.log(
      `Getting all workers from iteration 1 through ${currentIteration} (${earliestStartTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()})`,
    );

    // Calculate total worker count for all iterations up to current
    let totalWorkerCount = 0;
    for (let i = 0; i < currentIteration; i++) {
      totalWorkerCount += this.workersPerIteration[i];
    }

    // Get all workers created from iteration 1 start until current iteration end
    const allWorkers = await this.userModel
      .find({
        role: 'worker',
        createdAt: {
          $gte: earliestStartTime,
          $lte: endTime,
        },
      })
      .limit(totalWorkerCount)
      .sort({ createdAt: 1 })
      .exec();

    this.logger.log(
      `Found ${allWorkers.length} total workers for all iterations up to ${currentIteration}`,
    );

    return allWorkers;
  }

  @Cron(CronExpression.EVERY_30_SECONDS) // Run frequently to ensure all workers are evaluated
  async requalifyAllUsers() {
    try {
      // Ambil semua worker tanpa mempedulikan iteration
      const allWorkers = await this.userModel
        .find({ role: 'worker' })
        .sort({ createdAt: 1 })
        .exec();

      this.logger.log(`Requalify process: Found ${allWorkers.length} workers.`);

      // Hitung average accuracy untuk masing-masing worker yang punya record eligibility
      const workerAccuracies: Map<string, number> = new Map();
      const allAccuracyValues: number[] = [];
      for (const user of allWorkers) {
        const userIdStr = user._id.toString();

        // Ambil semua eligibility record untuk worker tersebut
        const eligibilities =
          await this.getEligibilityService.getEligibilityWorkerId(userIdStr);
        if (eligibilities.length === 0) {
          continue; // Lewati jika worker belum punya eligibility record
        }

        // Hitung nilai rata-rata accuracy dari record-record tersebut
        const totalAccuracy = eligibilities.reduce(
          (sum, e) => sum + (e.accuracy || 0),
          0,
        );
        const averageAccuracy = totalAccuracy / eligibilities.length;

        workerAccuracies.set(userIdStr, averageAccuracy);
        allAccuracyValues.push(averageAccuracy);

        this.logger.debug(
          `Worker ${userIdStr} (${user.firstName} ${user.lastName}) average accuracy: ${averageAccuracy.toFixed(3)}`,
        );
      }

      // Calculate the threshold using the UtilsService instead of fixed median calculation
      const threshold =
        await this.utilsService.calculateThreshold(allAccuracyValues);
      const thresholdRounded = Number(threshold.toFixed(3));

      this.logger.log(
        `Threshold value (rounded) for worker eligibility: ${thresholdRounded.toFixed(3)}`,
      );

      // Update eligibility untuk masing-masing worker yang memiliki average accuracy
      for (const user of allWorkers) {
        const userIdStr = user._id.toString();
        // Jika worker tidak memiliki eligibility record, dan sudah memiliki completedTasks, set default ke false
        if (!workerAccuracies.has(userIdStr)) {
          if (user.completedTasks && user.completedTasks.length > 0) {
            await this.userModel.findByIdAndUpdate(userIdStr, {
              $set: { isEligible: false },
            });
            this.logger.log(
              `Worker ${userIdStr} (${user.firstName} ${user.lastName}) set to non-eligible (default, no eligibility records).`,
            );
          }
          continue;
        }

        // Dapatkan rata-rata accuracy dan bulatkan
        const averageAccuracy = workerAccuracies.get(userIdStr);
        const averageAccuracyRounded = Number(averageAccuracy.toFixed(3));

        // Tentukan eligibility berdasarkan threshold yang telah dihitung
        const isEligible = averageAccuracyRounded > thresholdRounded;
        console.log(
          `Worker ${userIdStr} (${user.firstName} ${user.lastName}) - Average Accuracy: ${averageAccuracyRounded.toFixed(
            3,
          )}, Threshold: ${thresholdRounded.toFixed(3)}, Eligible: ${isEligible}`,
        );
        await this.userModel.findByIdAndUpdate(userIdStr, {
          $set: { isEligible: isEligible },
        });

        this.logger.log(
          `Updated eligibility for worker ${userIdStr} (${user.firstName} ${user.lastName}): ${isEligible ? 'Eligible' : 'Not Eligible'} (rounded accuracy: ${averageAccuracyRounded.toFixed(3)}, threshold: ${thresholdRounded.toFixed(3)})`,
        );
      }

      this.logger.log(
        `Requalify process completed. Threshold value (rounded): ${thresholdRounded.toFixed(3)}`,
      );
    } catch (error) {
      this.logger.error(`Error in requalifyAllUsers: ${error.message}`);
      throw new ThrowGQL(error.message, GQLThrowType.UNPROCESSABLE);
    }
  }
}
