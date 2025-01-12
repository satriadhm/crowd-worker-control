import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Users } from 'src/users/models/user';
import { GetUserArgs } from '../dto/args/get.user.args';

@Injectable()
export class GetUserService {
  constructor(
    @InjectModel(Users.name)
    private usersModel: Model<Users>,
  ) {}

  async getUserByUsername(userName: string): Promise<Users> {
    return this.usersModel.findOne({ userName });
  }

  async getUserByEmail(email: string): Promise<Users> {
    return this.usersModel.findOne({ email });
  }

  async getUserById(id: string): Promise<Users> {
    return this.usersModel.findById(id);
  }

  async getAllUsers(args: GetUserArgs): Promise<Users[]> {
    return this.usersModel.find().skip(args.skip).limit(args.take);
  }
}
