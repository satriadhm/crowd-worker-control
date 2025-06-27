// src/users/services/update.user.service.ts

import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
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
import { GetTaskService } from '../../tasks/services/get.task.service';
import { AccuracyCalculationServiceMX } from '../../MX/services/mx/mx.calculation.service';

@Injectable()
export class UpdateUserService {
  private readonly logger = new Logger(UpdateUserService.name);

  constructor(
    @InjectModel(Users.name)
    private userModel: Model<Users>,
    @InjectModel(Eligibility.name)
    private eligibilityModel: Model<Eligibility>,
    private readonly getEligibilityService: GetEligibilityService,
    @Inject(forwardRef(() => GetTaskService))
    private readonly getTaskService: GetTaskService,
    private readonly utilsService: UtilsService,
    @Inject(forwardRef(() => AccuracyCalculationServiceMX))
    private readonly accuracyCalculationService: AccuracyCalculationServiceMX,
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

      // Check if task is already completed
      if (!user.completedTasks.some((t) => t.taskId === taskId)) {
        const updatedUser = await this.userModel.findByIdAndUpdate(
          userId,
          { $push: { completedTasks: { taskId, answer } } },
          { new: true },
        );

        // Log completion status for debugging
        const totalTasks = await this.getTaskService.getTotalTasks();
        const completedCount = updatedUser.completedTasks?.length || 0;

        this.logger.log(
          `User ${userId} completed task ${taskId}. Progress: ${completedCount}/${totalTasks} tasks completed.`,
        );

        if (completedCount >= totalTasks) {
          this.logger.log(
            `User ${userId} has completed ALL ${totalTasks} tasks! Ready for M-X algorithm processing.`,
          );
        }

        return parseToView(updatedUser);
      }

      return parseToView(user);
    } catch (error) {
      throw new ThrowGQL(error, GQLThrowType.UNPROCESSABLE);
    }
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async qualifyAllUsers() {
    try {
      this.logger.log('Starting worker requalification process...');

      const totalTasks = await this.getTaskService.getTotalTasks();
      this.logger.log(`Total tasks in system: ${totalTasks}`);

      // Get all workers who have completed ALL tasks
      const allWorkers = await this.userModel
        .find({ role: 'worker' })
        .sort({ createdAt: 1 })
        .exec();

      this.logger.log(`Total workers found: ${allWorkers.length}`);

      // Filter workers who have completed ALL tasks
      const eligibleForRequalification = allWorkers.filter(
        (worker) =>
          worker.completedTasks && worker.completedTasks.length >= totalTasks,
      );

      this.logger.log(
        `Workers who completed all ${totalTasks} tasks: ${eligibleForRequalification.length}`,
      );

      if (eligibleForRequalification.length === 0) {
        this.logger.log(
          'No workers have completed all tasks yet. Skipping requalification.',
        );
        return;
      }

      // Trigger M-X algorithm processing for all tasks if enough workers completed all tasks
      if (eligibleForRequalification.length >= 3) {
        this.logger.log(
          `Triggering M-X algorithm processing with ${eligibleForRequalification.length} completed workers...`,
        );
        try {
          await this.accuracyCalculationService.processAllTasksForCompletedWorkers();
        } catch (error) {
          this.logger.error(
            `Error triggering M-X processing: ${error.message}`,
          );
        }
      }

      // Get workers who have eligibility records (M-X algorithm has processed them)
      const workersWithEligibility: Map<string, number> = new Map();
      let processedWorkersCount = 0;

      for (const user of eligibleForRequalification) {
        const userIdStr = user._id.toString();

        const eligibilities =
          await this.getEligibilityService.getEligibilityWorkerId(userIdStr);

        if (eligibilities.length > 0) {
          const totalAccuracy = eligibilities.reduce(
            (sum, e) => sum + (e.accuracy || 0),
            0,
          );
          const averageAccuracy = totalAccuracy / eligibilities.length;
          workersWithEligibility.set(userIdStr, averageAccuracy);
          processedWorkersCount++;

          this.logger.debug(
            `Worker ${userIdStr} (${user.firstName} ${user.lastName}) has ${eligibilities.length} eligibility records, average accuracy: ${averageAccuracy.toFixed(3)}`,
          );
        }
      }

      this.logger.log(
        `Workers with eligibility records (processed by M-X): ${processedWorkersCount}/${eligibleForRequalification.length}`,
      );

      if (processedWorkersCount === 0) {
        this.logger.log(
          'No workers have eligibility records yet. M-X algorithm still processing...',
        );
        return;
      }

      // Calculate threshold from processed workers
      const allAccuracyValues = Array.from(workersWithEligibility.values());
      const threshold =
        await this.utilsService.calculateThreshold(allAccuracyValues);
      const thresholdRounded = Number(threshold.toFixed(3));

      this.logger.log(
        `Calculated threshold: ${thresholdRounded.toFixed(3)} (based on ${allAccuracyValues.length} processed workers)`,
      );

      let updatedCount = 0;
      let eligibleCount = 0;
      let notEligibleCount = 0;
      let pendingCount = 0;

      // Update eligibility status for all workers who completed all tasks
      for (const user of eligibleForRequalification) {
        const userIdStr = user._id.toString();

        // Skip if worker already has definitive eligibility status
        if (user.isEligible !== null && user.isEligible !== undefined) {
          if (user.isEligible) {
            eligibleCount++;
          } else {
            notEligibleCount++;
          }
          continue;
        }

        // If worker doesn't have eligibility records yet, set as pending
        if (!workersWithEligibility.has(userIdStr)) {
          await this.userModel.findByIdAndUpdate(userIdStr, {
            $set: { isEligible: null },
          });
          pendingCount++;
          this.logger.debug(
            `Worker ${userIdStr} (${user.firstName} ${user.lastName}) set as pending (M-X processing not complete)`,
          );
          continue;
        }

        // Calculate eligibility based on accuracy vs threshold
        const averageAccuracy = workersWithEligibility.get(userIdStr);
        const averageAccuracyRounded = Number(averageAccuracy.toFixed(3));
        const isEligible = averageAccuracyRounded > thresholdRounded;

        // Update worker eligibility status
        await this.userModel.findByIdAndUpdate(userIdStr, {
          $set: { isEligible },
        });

        updatedCount++;
        if (isEligible) {
          eligibleCount++;
        } else {
          notEligibleCount++;
        }

        this.logger.log(
          `Updated worker ${userIdStr} (${user.firstName} ${user.lastName}): ${isEligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'} (accuracy: ${averageAccuracyRounded.toFixed(3)}, threshold: ${thresholdRounded.toFixed(3)})`,
        );
      }

      // Final summary
      this.logger.log(
        `Requalification completed. Updated: ${updatedCount}, Eligible: ${eligibleCount}, Not Eligible: ${notEligibleCount}, Pending: ${pendingCount}. Threshold: ${thresholdRounded.toFixed(3)}`,
      );
    } catch (error) {
      this.logger.error(`Error in qualifyAllUsers: ${error.message}`);
      throw new ThrowGQL(error.message, GQLThrowType.UNPROCESSABLE);
    }
  }
}
