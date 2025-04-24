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

  // @Cron(CronExpression.EVERY_MINUTE)
  async requalifyAllUsers() {
    try {
      const allWorkers = await this.userModel
        .find({ role: 'worker' })
        .sort({ createdAt: 1 })
        .exec();

      this.logger.log(`Requalify process: Found ${allWorkers.length} workers.`);

      const workerAccuracies: Map<string, number> = new Map();
      const allAccuracyValues: number[] = [];

      // First, filter workers who have more than 10 completed tasks
      const eligibleForRequalification = allWorkers.filter(
        (worker) => worker.completedTasks && worker.completedTasks.length > 10,
      );

      this.logger.log(
        `Requalify process: ${eligibleForRequalification.length} workers have more than 10 completed tasks.`,
      );

      // If no workers meet the criteria, exit early
      if (eligibleForRequalification.length === 0) {
        this.logger.log(
          'No workers with more than 10 completed tasks found. Exiting requalification process.',
        );
        return;
      }

      // Process only workers with more than 10 completed tasks
      for (const user of eligibleForRequalification) {
        const userIdStr = user._id.toString();

        const eligibilities =
          await this.getEligibilityService.getEligibilityWorkerId(userIdStr);
        if (eligibilities.length === 0) {
          continue; // Skip if worker has no eligibility records
        }

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

      // Calculate the threshold using the UtilsService
      const threshold =
        await this.utilsService.calculateThreshold(allAccuracyValues);
      const thresholdRounded = Number(threshold.toFixed(3));

      this.logger.log(
        `Threshold value (rounded) for worker eligibility: ${thresholdRounded.toFixed(3)}`,
      );

      // Update eligibility for each eligible worker
      for (const user of eligibleForRequalification) {
        const userIdStr = user._id.toString();

        // If worker has no eligibility records but has completed tasks, set default to false
        if (!workerAccuracies.has(userIdStr)) {
          await this.userModel.findByIdAndUpdate(userIdStr, {
            $set: { isEligible: false },
          });
          this.logger.log(
            `Worker ${userIdStr} (${user.firstName} ${user.lastName}) set to non-eligible (default, no eligibility records). Tasks completed: ${user.completedTasks.length}`,
          );
          continue;
        }

        // Get average accuracy and round it
        const averageAccuracy = workerAccuracies.get(userIdStr);
        const averageAccuracyRounded = Number(averageAccuracy.toFixed(3));

        // Determine eligibility based on calculated threshold
        const isEligible = averageAccuracyRounded > thresholdRounded;

        this.logger.log(
          `Worker ${userIdStr} (${user.firstName} ${user.lastName}) - Average Accuracy: ${averageAccuracyRounded.toFixed(
            3,
          )}, Threshold: ${thresholdRounded.toFixed(3)}, Eligible: ${isEligible}, Tasks completed: ${user.completedTasks.length}`,
        );

        await this.userModel.findByIdAndUpdate(userIdStr, {
          $set: { isEligible: isEligible },
        });

        this.logger.log(
          `Updated eligibility for worker ${userIdStr} (${user.firstName} ${user.lastName}): ${isEligible ? 'Eligible' : 'Not Eligible'} (rounded accuracy: ${averageAccuracyRounded.toFixed(3)}, threshold: ${thresholdRounded.toFixed(3)})`,
        );
      }

      this.logger.log(
        `Requalify process completed. Threshold value (rounded): ${thresholdRounded.toFixed(3)}, ${eligibleForRequalification.length} workers processed.`,
      );
    } catch (error) {
      this.logger.error(`Error in requalifyAllUsers: ${error.message}`);
      throw new ThrowGQL(error.message, GQLThrowType.UNPROCESSABLE);
    }
  }
}
