import { Injectable } from '@nestjs/common';
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
import { Logger } from '@nestjs/common';

@Injectable()
export class UpdateUserService {
  // Define specific timestamps for the three iterations
  private readonly iterationTimes = [
    new Date('2025-04-15T11:00:00'), // Iteration 1 - 11:00
    new Date('2025-04-15T12:30:00'), // Iteration 2 - 12:30
    new Date('2025-04-15T14:00:00'), // Iteration 3 - 14:00
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
   * Get the current iteration based on the current time
   */
  private getCurrentIteration(): number {
    const now = new Date();

    // Force the current iteration to be 3 for testing purposes
    // This ensures all workers in iteration 3 will be evaluated
    return 3;

    // Regular logic (commented out for now)
    // if (now >= this.iterationTimes[2]) {
    //   return 3; // After 14:00, we're in the third iteration
    // } else if (now >= this.iterationTimes[1]) {
    //   return 2; // After 12:30, we're in the second iteration
    // } else if (now >= this.iterationTimes[0]) {
    //   return 1; // After 11:00, we're in the first iteration
    // } else {
    //   return 0; // Before any iterations have started
    // }
  }

  /**
   * Get the workers who should be evaluated in the current iteration
   * based on their creation timestamps
   */
  private async getWorkersForCurrentIteration(): Promise<Users[]> {
    const currentIteration = this.getCurrentIteration();
    if (currentIteration === 0) {
      return []; // No iterations have started yet
    }

    // When in iteration 3, get all workers up to the maximum count
    // This ensures we evaluate all workers including those missed
    if (currentIteration === 3) {
      const totalMaxWorkers = this.workersPerIteration[currentIteration - 1];
      const allWorkers = await this.userModel
        .find({ role: 'worker' })
        .sort({ createdAt: 1 })
        .limit(totalMaxWorkers)
        .exec();

      this.logger.debug(
        `Workers for iteration ${currentIteration}: Found ${allWorkers.length} workers to evaluate`,
      );

      return allWorkers;
    }

    // Standard implementation for iterations 1 and 2
    // Get iteration time boundaries
    const startTime = this.iterationTimes[currentIteration - 1];
    const endTime =
      currentIteration < 3
        ? this.iterationTimes[currentIteration]
        : new Date('2025-04-15T23:59:59'); // End of day for iteration 3

    // Get workers created within this time range
    const workersForIteration = await this.userModel
      .find({
        role: 'worker',
        createdAt: {
          $gte: startTime,
          $lt: endTime,
        },
      })
      .limit(this.workersPerIteration[currentIteration - 1])
      .exec();

    this.logger.debug(
      `Workers for iteration ${currentIteration}: ${workersForIteration.length} workers created between ${startTime.toLocaleTimeString()} and ${endTime.toLocaleTimeString()}`,
    );

    return workersForIteration;
  }

  @Cron(CronExpression.EVERY_30_SECONDS) // Run frequently to ensure all workers are evaluated
  async qualifyUser() {
    try {
      // Manually set the current iteration to 3 to process all workers
      const currentIteration = 3;
      this.logger.log(
        `Forcing iteration evaluation to iteration ${currentIteration}`,
      );

      // Get the threshold for eligibility
      const thresholdString = configService.getEnvValue('MX_THRESHOLD');
      const threshold = parseFloat(thresholdString);

      // Force the evaluation for all workers with role=worker
      // Instead of filtering by iteration
      const workersToEvaluate = await this.userModel
        .find({ role: 'worker' })
        .limit(this.workersPerIteration[2]) // Use the limit for iteration 3
        .exec();

      this.logger.log(
        `Processing ${workersToEvaluate.length} workers (forced evaluation for all)`,
      );

      // Focus on workers with null eligibility status first
      const pendingWorkers = workersToEvaluate.filter(
        (w) => w.isEligible === null,
      );
      this.logger.log(
        `Found ${pendingWorkers.length} workers with null eligibility status`,
      );

      // Process all workers but prioritize those with null eligibility
      const allWorkers = [
        ...pendingWorkers,
        ...workersToEvaluate.filter((w) => w.isEligible !== null),
      ];

      // Only process unique workers (avoid duplicates)
      const uniqueWorkerIds = new Set();
      const uniqueWorkers = allWorkers.filter((worker) => {
        const workerId = worker._id.toString();
        if (uniqueWorkerIds.has(workerId)) {
          return false;
        }
        uniqueWorkerIds.add(workerId);
        return true;
      });

      // Only evaluate workers that belong to the current iteration
      for (const user of uniqueWorkers) {
        const userIdStr = user._id.toString();
        const eligibilities =
          await this.getEligibilityService.getEligibilityWorkerId(userIdStr);

        // Check if worker has completed any tasks yet
        const hasCompletedTasks =
          user.completedTasks && user.completedTasks.length > 0;

        // If no eligibility records but has completed tasks, set default false
        // This ensures workers who have attempted tasks but don't yet have
        // enough data for accurate evaluation aren't left with null status
        if (eligibilities.length === 0) {
          if (user.isEligible === null && hasCompletedTasks) {
            // Use findByIdAndUpdate instead of save()
            await this.userModel.findByIdAndUpdate(userIdStr, {
              $set: { isEligible: false },
            });
            this.logger.log(
              `User ${userIdStr} set to default non-eligible state (pending evaluation)`,
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

        // Update eligibility status based on threshold
        const newEligibilityStatus = averageAccuracy >= threshold;

        // Only update if changed or null to avoid unnecessary DB writes
        if (
          user.isEligible !== newEligibilityStatus ||
          user.isEligible === null
        ) {
          // Use findByIdAndUpdate with explicit $set to handle null→boolean conversion properly
          await this.userModel.findByIdAndUpdate(userIdStr, {
            $set: { isEligible: newEligibilityStatus },
          });
          this.logger.log(
            `Updated eligibility for worker ${userIdStr}: ${newEligibilityStatus} (avg accuracy: ${averageAccuracy.toFixed(2)})`,
          );
        }
      }
    } catch (error) {
      this.logger.error(`Error in qualifyUser: ${error.message}`);
      throw new ThrowGQL(error.message, GQLThrowType.UNPROCESSABLE);
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async calculateWorkerEligibility() {
    try {
      // Get threshold from config service
      const thresholdString = configService.getEnvValue('MX_THRESHOLD');
      const threshold = parseFloat(thresholdString);

      // Get all users with worker role, focusing on those with null eligibility
      const pendingWorkers = await this.userModel.find({
        role: 'worker',
        isEligible: null,
      });
      this.logger.log(
        `Processing eligibility for ${pendingWorkers.length} workers with null status (threshold: ${threshold})`,
      );

      // Process pending workers first
      for (const worker of pendingWorkers) {
        const workerId = worker._id.toString();
        // Get all eligibility records for this worker
        const eligibilities =
          await this.getEligibilityService.getEligibilityWorkerId(workerId);

        // If worker has done tasks but has no eligibility records, set default to false
        if (eligibilities.length === 0) {
          if (worker.completedTasks && worker.completedTasks.length > 0) {
            await this.userModel.findByIdAndUpdate(
              workerId,
              { $set: { isEligible: false } },
              { new: true },
            );
            this.logger.log(
              `Worker ${worker.firstName} ${worker.lastName} (${workerId}) has completed tasks but no evaluations - setting default to Not Eligible`,
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

        // Determine eligibility status
        const isEligible = averageAccuracy >= threshold;

        // Update worker's eligibility
        await this.userModel.findByIdAndUpdate(
          workerId,
          { $set: { isEligible: Boolean(isEligible) } },
          { new: true },
        );

        this.logger.log(
          `Worker: ${worker.firstName} ${worker.lastName} (${workerId}) - Updated status: ${isEligible ? 'Eligible' : 'Not Eligible'} (${(averageAccuracy * 100).toFixed(1)}%)`,
        );
      }

      // Now process any remaining workers to ensure all are up to date
      const allOtherWorkers = await this.userModel.find({
        role: 'worker',
        isEligible: { $ne: null },
      });

      this.logger.log(
        `Checking ${allOtherWorkers.length} workers with existing eligibility status`,
      );

      for (const worker of allOtherWorkers) {
        const workerId = worker._id.toString();
        // Get all eligibility records for this worker
        const eligibilities =
          await this.getEligibilityService.getEligibilityWorkerId(workerId);

        // Skip if no eligibility records
        if (eligibilities.length === 0) continue;

        // Calculate average accuracy from eligibility records
        const totalAccuracy = eligibilities.reduce(
          (sum, e) => sum + (e.accuracy || 0),
          0,
        );
        const averageAccuracy = totalAccuracy / eligibilities.length;

        // Determine eligibility status
        const isEligible = averageAccuracy >= threshold;

        // Only update if status would change
        if (worker.isEligible !== isEligible) {
          await this.userModel.findByIdAndUpdate(
            workerId,
            { $set: { isEligible: Boolean(isEligible) } },
            { new: true },
          );

          this.logger.log(
            `Worker: ${worker.firstName} ${worker.lastName} (${workerId}) - Status changed from ${worker.isEligible ? 'Eligible' : 'Not Eligible'} to ${isEligible ? 'Eligible' : 'Not Eligible'} (${(averageAccuracy * 100).toFixed(1)}%)`,
          );
        }
      }

      this.logger.log(
        'Eligibility calculation completed - all workers processed',
      );
    } catch (error) {
      this.logger.error(
        `Error calculating worker eligibility: ${error.message}`,
      );
      throw new ThrowGQL(error.message, GQLThrowType.UNPROCESSABLE);
    }
  }
}
