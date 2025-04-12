import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Users } from 'src/users/models/user';
import { GetUserArgs } from '../dto/args/get.user.args';
import { GQLThrowType, ThrowGQL } from '@app/gqlerr';
import { parseToView } from '../models/parser';
import { UserView } from '../dto/views/user.view';
import { Role } from 'src/lib/user.enum';

@Injectable()
export class GetUserService {
  constructor(
    @InjectModel(Users.name)
    private usersModel: Model<Users>,
  ) {}

  async getUserByUsername(userName: string): Promise<UserView> {
    try {
      const res = await this.usersModel.findOne({ userName });
      return parseToView(res);
    } catch (error) {
      throw new ThrowGQL(error, GQLThrowType.UNPROCESSABLE);
    }
  }

  async getUserByEmail(email: string): Promise<UserView> {
    try {
      const res = await this.usersModel.findOne({ email });
      return parseToView(res);
    } catch (error) {
      throw new ThrowGQL(error, GQLThrowType.UNPROCESSABLE);
    }
  }

  async getUserById(id: string): Promise<UserView> {
    try {
      const res = await this.usersModel.findById(id);
      return parseToView(res);
    } catch (error) {
      throw new ThrowGQL(error, GQLThrowType.UNPROCESSABLE);
    }
  }

  async getAllUsers(args: GetUserArgs): Promise<UserView[]> {
    try {
      const res = await this.usersModel.find().limit(args.take).skip(args.skip);
      return res.map(parseToView);
    } catch (error) {
      throw new ThrowGQL(error, GQLThrowType.UNPROCESSABLE);
    }
  }

  async getTotalUsers(): Promise<number> {
    try {
      return this.usersModel.countDocuments({ role: Role.WORKER });
    } catch (error) {
      throw new ThrowGQL(error, GQLThrowType.UNPROCESSABLE);
    }
  }
}
