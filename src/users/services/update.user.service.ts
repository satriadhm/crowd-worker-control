import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Users } from '../models/user';
import { UpdateUserInput } from '../dto/inputs/update.user.input';
import { UserView } from '../dto/views/user.view';
import { GQLThrowType, ThrowGQL } from '@app/gqlerr';
import { parseToView } from '../models/parser';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GetEligibilityService } from '../../M1/services/eligibility/get.eligibility.service';
import { CreateRecordedAnswerInput } from 'src/M1/dto/recorded/create.recorded.input';
import { Eligibility } from 'src/M1/models/eligibility';

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
    @InjectModel(Eligibility.name) // Inject the Eligibility model properly
    private eligibilityModel: Model<Eligibility>,
    private readonly getEligibilityService: GetEligibilityService,
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

  /**
   * Calculate the median value from an array of numbers
   */
  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;

    // Sort the array
    const sorted = [...values].sort((a, b) => a - b);

    // Find the middle
    const middle = Math.floor(sorted.length / 2);

    // If odd length, return the middle value
    if (sorted.length % 2 === 1) {
      return sorted[middle];
    }

    // If even length, return the average of the two middle values
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  // @Cron(CronExpression.EVERY_30_SECONDS) // Run frequently to ensure all workers are evaluated
  // async qualifyUser() {
  //   try {
  //     const currentIteration = this.getCurrentIteration();
  //     this.logger.log(
  //       `Starting worker qualification process for iteration ${currentIteration}`,
  //     );

  //     if (currentIteration === 0) {
  //       this.logger.log(
  //         'No iterations have started yet. Skipping worker qualification.',
  //       );
  //       return;
  //     }

  //     // Get all workers for all completed iterations
  //     const workersToEvaluate =
  //       await this.getWorkersForAllCompletedIterations();

  //     this.logger.log(
  //       `Found ${workersToEvaluate.length} workers to evaluate across all iterations up to iteration ${currentIteration}`,
  //     );

  //     // Calculate average accuracy for each worker first
  //     const workerAccuracies: Map<string, number> = new Map();
  //     const allAccuracyValues: number[] = [];

  //     for (const user of workersToEvaluate) {
  //       const userIdStr = user._id.toString();

  //       // Get all eligibility records for this worker
  //       const eligibilities =
  //         await this.getEligibilityService.getEligibilityWorkerId(userIdStr);

  //       // Skip if no eligibility records
  //       if (eligibilities.length === 0) {
  //         continue;
  //       }

  //       // Calculate average accuracy from eligibility records
  //       const totalAccuracy = eligibilities.reduce(
  //         (sum, e) => sum + (e.accuracy || 0),
  //         0,
  //       );
  //       const averageAccuracy = totalAccuracy / eligibilities.length;

  //       // Store the worker's average accuracy
  //       workerAccuracies.set(userIdStr, averageAccuracy);
  //       allAccuracyValues.push(averageAccuracy);

  //       this.logger.debug(
  //         `Worker ${userIdStr} (${user.firstName} ${user.lastName}) average accuracy: ${averageAccuracy.toFixed(4)}`,
  //       );
  //     }

  //     // Calculate the median accuracy across all workers
  //     const medianAccuracy = this.calculateMedian(allAccuracyValues);
  //     this.logger.log(
  //       `Median accuracy across all workers: ${medianAccuracy.toFixed(4)}`,
  //     );

  //     // Process workers with null eligibility status first
  //     const pendingWorkers = workersToEvaluate.filter(
  //       (w) => w.isEligible === null,
  //     );
  //     this.logger.log(
  //       `Found ${pendingWorkers.length} workers with null eligibility status that need evaluation`,
  //     );

  //     // Process all workers, starting with pending ones
  //     const allWorkersToProcess = [
  //       ...pendingWorkers,
  //       ...workersToEvaluate.filter((w) => w.isEligible !== null),
  //     ];

  //     for (const user of allWorkersToProcess) {
  //       const userIdStr = user._id.toString();

  //       // Skip if worker has no accuracy calculated yet
  //       if (!workerAccuracies.has(userIdStr)) {
  //         // Check if worker has completed any tasks yet
  //         const hasCompletedTasks =
  //           user.completedTasks && user.completedTasks.length > 0;

  //         // If they have completed tasks but no eligibility records, set to false
  //         if (hasCompletedTasks && user.isEligible === null) {
  //           await this.userModel.findByIdAndUpdate(userIdStr, {
  //             $set: { isEligible: false },
  //           });
  //           this.logger.log(
  //             `Worker ${userIdStr} (${user.firstName} ${user.lastName}) set to default non-eligible state (has completed tasks but no eligibility records)`,
  //           );
  //         }
  //         continue;
  //       }

  //       // Get the worker's average accuracy
  //       const averageAccuracy = workerAccuracies.get(userIdStr);

  //       // Determine eligibility based on median threshold:
  //       // Workers with accuracy above the median are eligible
  //       const isEligible = averageAccuracy > medianAccuracy;

  //       // Only update if the eligibility status changed or was null
  //       if (user.isEligible !== isEligible || user.isEligible === null) {
  //         await this.userModel.findByIdAndUpdate(userIdStr, {
  //           $set: { isEligible: isEligible },
  //         });

  //         this.logger.log(
  //           `Updated eligibility for worker ${userIdStr} (${user.firstName} ${user.lastName}): ${isEligible ? 'Eligible' : 'Not Eligible'} (accuracy: ${averageAccuracy.toFixed(4)}, median: ${medianAccuracy.toFixed(4)})`,
  //         );
  //       }
  //     }

  //     this.logger.log(
  //       `Worker qualification process completed for iteration ${currentIteration}. Median threshold: ${medianAccuracy.toFixed(4)}`,
  //     );
  //   } catch (error) {
  //     this.logger.error(`Error in qualifyUser: ${error.message}`);
  //     throw new ThrowGQL(error.message, GQLThrowType.UNPROCESSABLE);
  //   }
  // }

  @Cron(CronExpression.EVERY_30_SECONDS) // Anda bisa sesuaikan jadwalnya atau memanggilnya secara manual
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

      // Hitung nilai median accuracy dan bulatkan ke tiga angka di belakang koma
      const medianAccuracy = this.calculateMedian(allAccuracyValues);
      const medianRounded = Number(medianAccuracy.toFixed(3));
      this.logger.log(
        `Median accuracy (rounded) across all workers: ${medianRounded.toFixed(3)}`,
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

        // Tentukan eligibility dengan operator > (strictly greater)
        const isEligible = averageAccuracyRounded > medianRounded;
        console.log(
          `Worker ${userIdStr} (${user.firstName} ${user.lastName}) - Average Accuracy: ${averageAccuracyRounded.toFixed(
            3,
          )}, Median: ${medianRounded.toFixed(3)}, Eligible: ${isEligible}`,
        );
        await this.userModel.findByIdAndUpdate(userIdStr, {
          $set: { isEligible: isEligible },
        });

        this.logger.log(
          `Updated eligibility for worker ${userIdStr} (${user.firstName} ${user.lastName}): ${isEligible ? 'Eligible' : 'Not Eligible'} (rounded accuracy: ${averageAccuracyRounded.toFixed(3)}, median: ${medianRounded.toFixed(3)})`,
        );
      }

      this.logger.log(
        `Requalify process completed. Median threshold (rounded): ${medianRounded.toFixed(3)}`,
      );
    } catch (error) {
      this.logger.error(`Error in requalifyAllUsers: ${error.message}`);
      throw new ThrowGQL(error.message, GQLThrowType.UNPROCESSABLE);
    }
  }
}
