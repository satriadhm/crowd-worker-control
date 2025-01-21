import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Users } from '../models/user';
import { GQLThrowType, ThrowGQL } from '@app/gqlerr';
import { UserView } from '../dto/views/user.view';
import { parseToView } from '../models/parser';

@Injectable()
export class DeleteUserService {
  constructor(
    @InjectModel(Users.name)
    private readonly userModel: Model<Users>,
  ) {}

  async delete(id: string): Promise<UserView> {
    try {
      const res = await this.userModel.findByIdAndDelete(id);
      return parseToView(res);
    } catch (error) {
      throw new ThrowGQL(error, GQLThrowType.UNPROCESSABLE);
    }
  }

  async deleteAll(): Promise<any> {
    try {
      return this.userModel.deleteMany({});
    } catch (error) {
      throw new ThrowGQL(error, GQLThrowType.UNPROCESSABLE);
    }
  }
}
