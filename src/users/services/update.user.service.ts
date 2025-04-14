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

  @Cron(CronExpression.EVERY_MINUTE)
  async qualifyUser() {
    try {
      const thresholdString = configService.getEnvValue('MX_THRESHOLD');
      const threshold = parseFloat(thresholdString);
      const allUsers = await this.userModel.find({ role: 'worker' }).exec();

      for (const user of allUsers) {
        const eligibilities =
          await this.getEligibilityService.getEligibilityWorkerId(
            user._id.toString(),
          );

        // Jika tidak ada eligibility, jangan ubah isEligible jika sudah ada nilai
        if (eligibilities.length === 0) {
          // Hanya ubah jika belum ada nilai (null) atau jika memang ingin diubah menjadi false
          if (user.isEligible === null) {
            user.isEligible = false;
            await user.save();
          }
          continue;
        }

        const totalAccuracy = eligibilities.reduce(
          (sum, e) => sum + (e.accuracy || 0),
          0,
        );
        const averageAccuracy = totalAccuracy / eligibilities.length;

        user.isEligible = averageAccuracy >= threshold;
        await user.save();
      }
    } catch (error) {
      throw new ThrowGQL(error, GQLThrowType.UNPROCESSABLE);
    }
  }
}
