import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Users } from '../models/user';
import { GQLThrowType, ThrowGQL } from '@app/gqlerr';

@Injectable()
export class DeleteUserService {
  constructor(
    @InjectModel(Users.name)
    private readonly userModel: Model<Users>,
  ) {}

  async delete(id: string): Promise<Users> {
    try {
      return this.userModel.findByIdAndDelete(id);
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
