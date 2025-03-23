import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Users } from '../models/user';
import { UpdateUserInput } from '../dto/inputs/update.user.input';
import { UserView } from '../dto/views/user.view';
import { GQLThrowType, ThrowGQL } from '@app/gqlerr';
import { parseToView } from '../models/parser';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class UpdateUserService {
  constructor(
    @InjectModel(Users.name)
    private userModel: Model<Users>,
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
    // TODO: ambil semua data eligibilities.
    // TODO: hitung Hitung rata-rata dengan membagi total akurasi dengan jumlah task yang dijawab.
    // Bandingkan rata-rata akurasi dengan threshold minimal (misalnya 0.7 atau 70%).
    // – Jika rata-rata akurasi ≥ threshold, maka user dianggap eligible.
    // – Jika rata-rata akurasi < threshold, maka user tidak memenuhi syarat.
  }
}
