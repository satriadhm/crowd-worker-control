import { Injectable } from '@nestjs/common';
import { UpdateTaskInput } from '../dto/inputs/update.task.input';
import { TaskView } from '../dto/views/task.view.input';
import { GQLThrowType, ThrowGQL } from '@app/gqlerr';
import { Task } from '../models/task';
import { Model } from 'mongoose';
import { parseToView } from '../models/parser';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class UpdateTaskService {
  constructor(
    @InjectModel(Task.name)
    private taskModel: Model<Task>,
  ) {}

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

  async validateQuestionTask(id: string) {
    try {
      const task = await this.taskModel.findById(id);
      if (!task) {
        throw new ThrowGQL('Task not found', GQLThrowType.NOT_FOUND);
      }
      task.isValidQuestion = true;
      task.save();
    } catch (error) {
      throw new ThrowGQL(error, GQLThrowType.UNPROCESSABLE);
    }
  }
}
