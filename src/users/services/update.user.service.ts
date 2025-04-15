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

@Injectable()
export class UpdateUserService {
  // Track the current iteration for the 5-iteration approach
  private currentIteration = 1;
  private readonly maxIterations = 5;
  private readonly workersPerIteration = [3, 6, 9, 12, 15]; // Target worker counts per iteration

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
      if (!user.completedTasks.some((t) => t.taskId === taskId)) {
        user.completedTasks.push({ taskId, answer });
        await user.save();
      }
      return parseToView(user);
    } catch (error) {
      throw new ThrowGQL(error, GQLThrowType.UNPROCESSABLE);
    }
  }

  /**
   * Check if a worker should be evaluated in the current iteration
   * This is determined by their position in the creation order
   */
  private async isWorkerInCurrentIteration(workerId: string): Promise<boolean> {
    if (this.currentIteration >= this.maxIterations) {
      return true; // In the final iteration, all workers are included
    }

    // Get worker's position in the creation order
    const allWorkers = await this.userModel
      .find({ role: 'worker' })
      .sort({ createdAt: 1 })
      .exec();

    const workerIds = allWorkers.map((worker) => worker._id.toString());
    const workerIndex = workerIds.indexOf(workerId);

    if (workerIndex === -1) {
      return false; // Worker not found
    }

    // Check if worker's index is within the current iteration limit
    return workerIndex < this.workersPerIteration[this.currentIteration - 1];
  }

  /**
   * Check if we should move to the next iteration based on the number of evaluated workers
   */
  private async shouldAdvanceIteration(): Promise<boolean> {
    if (this.currentIteration >= this.maxIterations) {
      return false; // Already at the maximum iteration
    }

    const evaluatedWorkers = await this.userModel.countDocuments({
      role: 'worker',
      isEligible: { $ne: null }, // Count workers who have been evaluated
    });

    // Check if we've reached or exceeded the worker target for current iteration
    return (
      evaluatedWorkers >= this.workersPerIteration[this.currentIteration - 1]
    );
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async qualifyUser() {
    try {
      // Check if we should advance to the next iteration
      const shouldAdvance = await this.shouldAdvanceIteration();
      if (shouldAdvance) {
        this.currentIteration = Math.min(
          this.currentIteration + 1,
          this.maxIterations,
        );
        console.log(`Advanced to iteration ${this.currentIteration}`);
      }

      const thresholdString = configService.getEnvValue('MX_THRESHOLD');
      const threshold = parseFloat(thresholdString);

      // Get workers sorted by creation date (oldest first)
      const allWorkers = await this.userModel
        .find({ role: 'worker' })
        .sort({ createdAt: 1 })
        .exec();

      // Limit workers based on the current iteration
      const iterationLimit =
        this.workersPerIteration[this.currentIteration - 1];
      const workersForIteration = allWorkers.slice(0, iterationLimit);

      console.log(
        `Processing ${workersForIteration.length} workers in iteration ${this.currentIteration}`,
      );

      for (const user of workersForIteration) {
        // Check if this worker should be evaluated in the current iteration
        const shouldEvaluate = await this.isWorkerInCurrentIteration(
          user._id.toString(),
        );
        if (!shouldEvaluate) {
          continue; // Skip workers not in this iteration
        }

        const eligibilities =
          await this.getEligibilityService.getEligibilityWorkerId(
            user._id.toString(),
          );

        // If no eligibility records and isEligible is null, set to false
        if (eligibilities.length === 0) {
          // Only update if isEligible is currently null
          if (user.isEligible === null) {
            user.isEligible = false;
            await user.save();
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

        // Only update if changed to avoid unnecessary DB writes
        if (user.isEligible !== newEligibilityStatus) {
          user.isEligible = newEligibilityStatus;
          await user.save();
          console.log(
            `Updated eligibility for worker ${user._id}: ${newEligibilityStatus}`,
          );
        }
      }
    } catch (error) {
      throw new ThrowGQL(error.message, GQLThrowType.UNPROCESSABLE);
    }
  }
}
