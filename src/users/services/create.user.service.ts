import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Users } from 'src/users/models/user';
import { CreateUserInput } from '../dto/inputs/create.user.input';
import { ObjectId } from 'bson';

@Injectable()
export class CreateUserService {
  constructor(
    @InjectModel(Users.name)
    private workersModel: Model<Users>,
  ) {}

  async create(createUserInput: CreateUserInput): Promise<Users> {
    try {
      const user = new this.workersModel({
        _id: new ObjectId(),
        ...createUserInput,
      });
      return user.save();
    } catch (error) {
      throw new Error(error);
    }
  }
}
