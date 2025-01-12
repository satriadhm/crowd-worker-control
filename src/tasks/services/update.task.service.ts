import { Injectable } from '@nestjs/common';
import { UpdateTaskInput } from '../dto/inputs/update.task.input';
import { TaskView } from '../dto/views/task.view.input';
import { GQLThrowType, ThrowGQL } from '@app/gqlerr';
import { Task } from '../models/task';
import { Model } from 'mongoose';
import { parseToView } from '../models/parser';

@Injectable()
export class UpdateTaskService {
  constructor(private taskModel: Model<Task>) {}

  async updateTask(input: UpdateTaskInput): Promise<TaskView> {
    try {
      const id = input.id;
      delete input.id;
      const res = await this.taskModel.findByIdAndUpdate(id, input, {
        new: true,
      });
      if (!res) {
        throw new ThrowGQL('Task not found', GQLThrowType.NOT_FOUND);
      }
      return parseToView(res);
    } catch (error) {
      throw new ThrowGQL(error, GQLThrowType.UNPROCESSABLE);
    }
  }
}
