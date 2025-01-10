import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Users } from 'src/users/models/user';
import { GetUserArgs } from '../dto/args/get.user.args';

@Injectable()
export class GetWorkersService {
  constructor(
    @InjectModel(Users.name)
    private workersModel: Model<Users>,
  ) {}

  async getUserByUsername(userName: string): Promise<Users> {
    return this.workersModel.findOne({ userName });
  }

  async getUserByEmail(email: string): Promise<Users> {
    return this.workersModel.findOne({ email });
  }

  async getAllUsers(args: GetUserArgs): Promise<Users[]> {
    return this.workersModel.find().skip(args.skip).limit(args.take);
  }
}
