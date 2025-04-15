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
  // Track the current iteration for the 5-iteration approach
  private currentIteration = 1;
  private readonly maxIterations = 5;
  private readonly workersPerIteration = [3, 6, 9, 12, 15]; // Target worker counts per iteration
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
   * Check if we should move to the next iteration based on the number of worker users
   * Fixed: Only advance when we have enough workers for the next iteration target
   */
  private async shouldAdvanceIteration(): Promise<boolean> {
    if (this.currentIteration >= this.maxIterations) {
      return false; // Already at the maximum iteration
    }

    // Get total worker count
    const totalWorkers = await this.userModel.countDocuments({
      role: 'worker',
    });

    // Only advance when we have enough workers for the *next* iteration
    const nextIterationIndex = Math.min(
      this.currentIteration,
      this.maxIterations - 1,
    );
    const nextIterationTarget = this.workersPerIteration[nextIterationIndex];

    this.logger.debug(
      `Total workers: ${totalWorkers}, Next iteration target: ${nextIterationTarget}`,
    );

    return totalWorkers >= nextIterationTarget;
  }

  /**
   * Get the workers who should be evaluated in the current iteration
   * This returns workers in the current iteration batch (between the previous and current target)
   */
  private async getWorkersForCurrentIteration(): Promise<Users[]> {
    // Get current iteration target
    const currentTarget = this.workersPerIteration[this.currentIteration - 1];

    // Get previous iteration target (0 for the first iteration)
    const prevTarget =
      this.currentIteration > 1
        ? this.workersPerIteration[this.currentIteration - 2]
        : 0;

    // Get workers sorted by creation date (oldest first)
    const allWorkers = await this.userModel
      .find({ role: 'worker' })
      .sort({ createdAt: 1 })
      .exec();

    // Only get workers that belong to the current iteration range
    const workersForIteration = allWorkers.slice(prevTarget, currentTarget);

    this.logger.debug(
      `Workers for iteration ${this.currentIteration}: ${workersForIteration.length} workers (${prevTarget + 1}-${currentTarget})`,
    );

    return workersForIteration;
  }

  @Cron(CronExpression.EVERY_30_SECONDS) // Run frequently enough to ensure eligibility gets updated
  async qualifyUser() {
    try {
      // Check if we should advance to the next iteration
      const shouldAdvance = await this.shouldAdvanceIteration();
      if (shouldAdvance) {
        this.currentIteration = Math.min(
          this.currentIteration + 1,
          this.maxIterations,
        );
        this.logger.log(`Advanced to iteration ${this.currentIteration}`);
      }

      // Get the threshold for eligibility
      const thresholdString = configService.getEnvValue('MX_THRESHOLD');
      const threshold = parseFloat(thresholdString);

      // Get workers for this iteration
      const workersForIteration = await this.getWorkersForCurrentIteration();

      this.logger.log(
        `Processing ${workersForIteration.length} workers in iteration ${this.currentIteration}`,
      );

      // Only evaluate workers that belong to the current iteration
      for (const user of workersForIteration) {
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
              isEligible: false,
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
          // Use findByIdAndUpdate instead of save()
          await this.userModel.findByIdAndUpdate(userIdStr, {
            isEligible: newEligibilityStatus,
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
}
