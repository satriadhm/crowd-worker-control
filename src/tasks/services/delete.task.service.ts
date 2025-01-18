import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { Task } from '../models/task';
import { GQLThrowType, ThrowGQL } from '@app/gqlerr';
import { TaskView } from '../dto/views/task.view.input';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class DeleteTaskService {
  constructor(
    @InjectModel(Task.name)
    private taskModel: Model<Task>,
  ) {}

  async delete(id: string): Promise<TaskView> {
    try {
      return this.taskModel.findByIdAndDelete(id);
    } catch (error) {
      throw new ThrowGQL(error, GQLThrowType.UNPROCESSABLE);
    }
  }
}
