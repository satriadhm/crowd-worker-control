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

      if (!user.completedTasks.some((t) => t.taskId === taskId)) {
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

  @Cron(CronExpression.EVERY_5_MINUTES)
  async qualifyAllUsers() {
    try {
      const allWorkers = await this.userModel
        .find({ role: 'worker' })
        .sort({ createdAt: 1 })
        .exec();

      this.logger.log(`Requalify process: Found ${allWorkers.length} workers.`);

      const workerAccuracies = new Map();
      const allAccuracyValues = [];

      const eligibleForRequalification = allWorkers.filter(
        async (worker) =>
          worker.completedTasks &&
          worker.completedTasks.length ===
            (await this.getTaskService.getTotalTasks()),
      );

      this.logger.log(
        `Requalify process: ${eligibleForRequalification.length} workers have more than 10 completed tasks.`,
      );

      if (eligibleForRequalification.length === 0) {
        this.logger.log(
          'No workers with more than 10 completed tasks found. Exiting requalification process.',
        );
        return;
      }

      for (const user of eligibleForRequalification) {
        const userIdStr = user._id.toString();

        const eligibilities =
          await this.getEligibilityService.getEligibilityWorkerId(userIdStr);
        if (eligibilities.length === 0) continue;

        const totalAccuracy = eligibilities.reduce(
          (sum, e) => sum + (e.accuracy || 0),
          0,
        );
        const averageAccuracy = totalAccuracy / eligibilities.length;

        workerAccuracies.set(userIdStr, averageAccuracy);
        allAccuracyValues.push(averageAccuracy);

        this.logger.debug(
          `Worker ${userIdStr} (${user.firstName} ${user.lastName}) average accuracy: ${averageAccuracy.toFixed(3)} (${user.completedTasks.length} tasks completed)`,
        );
      }

      const threshold =
        await this.utilsService.calculateThreshold(allAccuracyValues);
      const thresholdRounded = Number(threshold.toFixed(3));

      this.logger.log(
        `Threshold value (rounded) for worker eligibility: ${thresholdRounded.toFixed(3)}`,
      );

      for (const user of eligibleForRequalification) {
        const userIdStr = user._id.toString();

        if (user.isEligible !== null && user.isEligible !== undefined) {
          this.logger.log(
            `Skipping update for worker ${userIdStr} (${user.firstName} ${user.lastName}) as isEligible is already set.`,
          );
          continue;
        }

        if (!workerAccuracies.has(userIdStr)) {
          await this.userModel.findByIdAndUpdate(userIdStr, {
            $set: { isEligible: false },
          });
          this.logger.log(
            `Worker ${userIdStr} (${user.firstName} ${user.lastName}) set to non-eligible (default, no eligibility records). Tasks completed: ${user.completedTasks.length}`,
          );
          continue;
        }

        const averageAccuracy = workerAccuracies.get(userIdStr);
        const averageAccuracyRounded = Number(averageAccuracy.toFixed(3));
        const isEligible = averageAccuracyRounded > thresholdRounded;

        this.logger.log(
          `Worker ${userIdStr} (${user.firstName} ${user.lastName}) - Average Accuracy: ${averageAccuracyRounded.toFixed(3)}, Threshold: ${thresholdRounded.toFixed(3)}, Eligible: ${isEligible}, Tasks completed: ${user.completedTasks.length}`,
        );

        await this.userModel.findByIdAndUpdate(userIdStr, {
          $set: { isEligible },
        });

        this.logger.log(
          `Updated eligibility for worker ${userIdStr} (${user.firstName} ${user.lastName}): ${isEligible ? 'Eligible' : 'Not Eligible'} (rounded accuracy: ${averageAccuracyRounded.toFixed(3)}, threshold: ${thresholdRounded.toFixed(3)})`,
        );
      }

      this.logger.log(
        `Requalify process completed. Threshold value (rounded): ${thresholdRounded.toFixed(3)}, ${eligibleForRequalification.length} workers processed.`,
      );
    } catch (error) {
      this.logger.error(`Error in qualifyAllUsers: ${error.message}`);
      throw new ThrowGQL(error.message, GQLThrowType.UNPROCESSABLE);
    }
  }
}
