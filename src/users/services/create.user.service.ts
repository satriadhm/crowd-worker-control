import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Users } from 'src/users/models/user';
import { CreateUserInput } from '../dto/inputs/create.user.input';
import { ObjectId } from 'bson';
import { parseToView } from '../models/parser';
import { GQLThrowType, ThrowGQL } from '@app/gqlerr';
import { UserView } from '../dto/views/user.view';

@Injectable()
export class CreateUserService {
  constructor(
    @InjectModel(Users.name)
    private userModel: Model<Users>,
  ) {}

  async create(createUserInput: CreateUserInput): Promise<UserView> {
    try {
      const isEligible = null;

      const user = await new this.userModel({
        _id: new ObjectId(),
        ...createUserInput,
        isEligible,
      }).save();
      return parseToView(user);
    } catch (error) {
      throw new ThrowGQL(error, GQLThrowType.UNPROCESSABLE);
    }
  }
}
