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
import { configService } from 'src/config/config.service';

@Injectable()
export class UpdateUserService {
  // Define specific timestamps for the three iterations based on the updated requirements
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

    // For testing purposes, we can force the current time
    // const now = new Date('2025-04-15T07:30:00'); // Uncomment for testing specific times

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
  async qualifyUser() {
    try {
      const currentIteration = this.getCurrentIteration();
      this.logger.log(
        `Starting worker qualification process for iteration ${currentIteration}`,
      );

      if (currentIteration === 0) {
        this.logger.log(
          'No iterations have started yet. Skipping worker qualification.',
        );
        return;
      }

      // Get the threshold for eligibility
      const thresholdString = configService.getEnvValue('MX_THRESHOLD');
      const threshold = parseFloat(thresholdString);
      this.logger.log(`Using eligibility threshold: ${threshold}`);

      // Get all workers for all completed iterations
      const workersToEvaluate =
        await this.getWorkersForAllCompletedIterations();

      this.logger.log(
        `Found ${workersToEvaluate.length} workers to evaluate across all iterations up to iteration ${currentIteration}`,
      );

      // Focus on workers with null eligibility status first (these are the ones we need to fix)
      const pendingWorkers = workersToEvaluate.filter(
        (w) => w.isEligible === null,
      );
      this.logger.log(
        `Found ${pendingWorkers.length} workers with null eligibility status that need evaluation`,
      );

      // Process all pending workers first
      for (const user of pendingWorkers) {
        const userIdStr = user._id.toString();

        // Get all eligibility records for this worker
        const eligibilities =
          await this.getEligibilityService.getEligibilityWorkerId(userIdStr);
        this.logger.debug(
          `Worker ${userIdStr} has ${eligibilities.length} eligibility records`,
        );

        // Check if worker has completed any tasks yet
        const hasCompletedTasks =
          user.completedTasks && user.completedTasks.length > 0;

        if (eligibilities.length === 0) {
          // If the worker has completed tasks but has no eligibility records,
          // set default to false until proper evaluation
          if (hasCompletedTasks) {
            await this.userModel.findByIdAndUpdate(userIdStr, {
              $set: { isEligible: false },
            });
            this.logger.log(
              `Worker ${userIdStr} (${user.firstName} ${user.lastName}) set to default non-eligible state (has completed tasks but pending evaluation)`,
            );
          }
          continue;
        }

        // Calculate average accuracy from eligibility records
        const totalAccuracy = eligibilities.reduce(
          (sum, e) => sum + (e.accuracy || 0),
          0,
        );
        const averageAccuracy = totalAccuracy / eligibilities.length;

        // Determine eligibility status based on threshold
        const isEligible = averageAccuracy >= threshold;

        // Update the worker's eligibility status
        await this.userModel.findByIdAndUpdate(userIdStr, {
          $set: { isEligible: isEligible },
        });

        this.logger.log(
          `Updated eligibility for worker ${userIdStr} (${user.firstName} ${user.lastName}): ${isEligible ? 'Eligible' : 'Not Eligible'} (avg accuracy: ${averageAccuracy.toFixed(2)})`,
        );
      }

      // Also check any workers with existing eligibility status to ensure they're up to date
      const workersWithStatus = workersToEvaluate.filter(
        (w) => w.isEligible !== null,
      );

      this.logger.log(
        `Checking ${workersWithStatus.length} workers with existing eligibility status for updates`,
      );

      for (const user of workersWithStatus) {
        const userIdStr = user._id.toString();
        const eligibilities =
          await this.getEligibilityService.getEligibilityWorkerId(userIdStr);

        if (eligibilities.length === 0) continue;

        // Calculate average accuracy
        const totalAccuracy = eligibilities.reduce(
          (sum, e) => sum + (e.accuracy || 0),
          0,
        );
        const averageAccuracy = totalAccuracy / eligibilities.length;
        const newEligibilityStatus = averageAccuracy >= threshold;

        // Only update if status has changed
        if (user.isEligible !== newEligibilityStatus) {
          await this.userModel.findByIdAndUpdate(userIdStr, {
            $set: { isEligible: newEligibilityStatus },
          });

          this.logger.log(
            `Updated eligibility for worker ${userIdStr} (${user.firstName} ${user.lastName}): changed from ${user.isEligible ? 'Eligible' : 'Not Eligible'} to ${newEligibilityStatus ? 'Eligible' : 'Not Eligible'} (avg accuracy: ${averageAccuracy.toFixed(2)})`,
          );
        }
      }

      this.logger.log(
        `Worker qualification process for iteration ${currentIteration} completed successfully`,
      );
    } catch (error) {
      this.logger.error(`Error in qualifyUser: ${error.message}`);
      throw new ThrowGQL(error.message, GQLThrowType.UNPROCESSABLE);
    }
  }
}
