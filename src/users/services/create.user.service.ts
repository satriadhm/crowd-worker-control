import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ObjectId } from 'bson';
import { Users } from 'src/users/models/user';
import { CreateUserInput } from '../dto/inputs/create.user.input';

@Injectable()
export class CreateUserService {
  constructor(
    @InjectModel(Users.name)
    private workersModel: Model<Users>,
  ) {}

  async create(createUserInput: CreateUserInput): Promise<Users> {
    try {
      const user = new this.workersModel({
        ...createUserInput,
        _id: new ObjectId(),
      });
      return user.save();
    } catch (error) {
      throw new Error(error);
    }
  }
}
