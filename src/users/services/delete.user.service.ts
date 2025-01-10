import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { Users } from '../models/user.entity';

@Injectable()
export class DeleteUserService {
  constructor(private workerModel: Model<Users>) {}

  async delete(id: string): Promise<Users> {
    try {
      return this.workerModel.findByIdAndDelete(id);
    } catch (error) {
      throw new Error(error);
    }
  }

  async deleteAll() {
    try {
      return this.workerModel.deleteMany({});
    } catch (error) {
      throw new Error(error);
    }
  }
}
