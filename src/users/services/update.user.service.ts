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

  async userHasDoneTask(taskId: string, userId: string): Promise<UserView> {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new ThrowGQL('User not found', GQLThrowType.NOT_FOUND);
      }
      if (!user.isDoneTaskIds.includes(taskId)) {
        user.isDoneTaskIds.push(taskId);
        await user.save();
      }
      return parseToView(user);
    } catch (error) {
      throw new ThrowGQL(error, GQLThrowType.UNPROCESSABLE);
    }
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async qualifyUser() {
    try {
      const threshold = 0.7;
      const allUsers = await this.userModel.find({ role: 'worker' }).exec();

      for (const user of allUsers) {
        const eligibilities =
          await this.getEligibilityService.getEligibilityWorkerId(
            user._id.toString(),
          );

        if (eligibilities.length === 0) {
          user.isEligible = false;
          await user.save();
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
