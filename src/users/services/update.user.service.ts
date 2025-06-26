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

  @Cron(CronExpression.EVERY_5_MINUTES)
  async qualifyAllUsers() {
    try {
      this.logger.log('Starting qualifyAllUsers cron job...');

      const totalTasks = await this.getTaskService.getTotalTasks();
      this.logger.log(`Total tasks in system: ${totalTasks}`);

      // Get all workers, sorted by creation date
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
          'No workers have completed all tasks yet. Exiting requalification process.',
        );
        return;
      }

      // Get threshold settings
      const thresholdSettings = await this.utilsService.getThresholdSettings();
      const threshold = thresholdSettings.thresholdValue;

      this.logger.log(
        `Using threshold: ${threshold.toFixed(3)} (${thresholdSettings.thresholdType})`,
      );

      // Collect accuracy data for workers who completed all tasks
      const workerAccuracies = new Map<string, number>();
      const allAccuracyValues: number[] = [];

      for (const user of eligibleForRequalification) {
        const userIdStr = user._id.toString();

        const eligibilities =
          await this.getEligibilityService.getEligibilityWorkerId(userIdStr);

        if (eligibilities.length === 0) {
          this.logger.debug(
            `Worker ${userIdStr} (${user.firstName} ${user.lastName}) has no eligibility records yet - pending M-X processing`,
          );
          continue;
        }

        const totalAccuracy = eligibilities.reduce(
          (sum, e) => sum + (e.accuracy || 0),
          0,
        );
        const averageAccuracy = totalAccuracy / eligibilities.length;

        workerAccuracies.set(userIdStr, averageAccuracy);
        allAccuracyValues.push(averageAccuracy);

        this.logger.debug(
          `Worker ${userIdStr} (${user.firstName} ${user.lastName}) average accuracy: ${averageAccuracy.toFixed(3)} (${eligibilities.length} eligibility records, ${user.completedTasks.length} tasks completed)`,
        );
      }

      if (allAccuracyValues.length === 0) {
        this.logger.log(
          'No workers have eligibility records yet. Waiting for M-X algorithm processing...',
        );
        return;
      }

      // Calculate threshold based on available accuracy data
      const calculatedThreshold =
        await this.utilsService.calculateThreshold(allAccuracyValues);
      const thresholdRounded = Number(calculatedThreshold.toFixed(3));

      this.logger.log(
        `Calculated threshold for worker eligibility: ${thresholdRounded.toFixed(3)}`,
      );

      let updatedCount = 0;
      let eligibleCount = 0;
      let notEligibleCount = 0;
      let pendingCount = 0;

      // Process each worker who completed all tasks
      for (const user of eligibleForRequalification) {
        const userIdStr = user._id.toString();

        // Skip if already has definitive eligibility status (not null)
        if (user.isEligible !== null && user.isEligible !== undefined) {
          if (user.isEligible) {
            eligibleCount++;
          } else {
            notEligibleCount++;
          }
          continue;
        }

        // If worker has no eligibility records, keep as pending
        if (!workerAccuracies.has(userIdStr)) {
          await this.userModel.findByIdAndUpdate(userIdStr, {
            $set: { isEligible: null },
          });
          pendingCount++;
          this.logger.debug(
            `Worker ${userIdStr} (${user.firstName} ${user.lastName}) set to pending (no eligibility records yet). Tasks completed: ${user.completedTasks.length}`,
          );
          continue;
        }

        // Calculate eligibility based on accuracy vs threshold
        const averageAccuracy = workerAccuracies.get(userIdStr);
        const averageAccuracyRounded = Number(averageAccuracy.toFixed(3));
        const isEligible = averageAccuracyRounded > thresholdRounded;

        // Update worker eligibility
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
          `Updated worker ${userIdStr} (${user.firstName} ${user.lastName}): ${isEligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'} (accuracy: ${averageAccuracyRounded.toFixed(3)}, threshold: ${thresholdRounded.toFixed(3)}, tasks: ${user.completedTasks.length})`,
        );
      }

      // Log summary
      this.logger.log(
        `Requalification completed. Updated: ${updatedCount}, Eligible: ${eligibleCount}, Not Eligible: ${notEligibleCount}, Pending: ${pendingCount}. Threshold: ${thresholdRounded.toFixed(3)}`,
      );
    } catch (error) {
      this.logger.error(`Error in qualifyAllUsers: ${error.message}`);
      throw new ThrowGQL(error.message, GQLThrowType.UNPROCESSABLE);
    }
  }
}
