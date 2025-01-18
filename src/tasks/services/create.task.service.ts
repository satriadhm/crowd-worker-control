import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { Task } from '../models/task';
import { CreateTaskInput } from '../dto/inputs/create.task.input';
import { GQLThrowType, ThrowGQL } from '@app/gqlerr';
import { TaskView } from '../dto/views/task.view.input';
import { parseToView } from '../models/parser';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class CreateTaskService {
  constructor(
    @InjectModel(Task.name)
    private taskModel: Model<Task>,
  ) {}

  async createTask(input: CreateTaskInput): Promise<TaskView> {
    try {
      const result = await this.taskModel.create(input);
      return parseToView(result);
    } catch (error) {
      throw new ThrowGQL(error, GQLThrowType.UNPROCESSABLE);
    }
  }
}
