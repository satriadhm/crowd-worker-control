import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { Task } from '../models/task';
import { CreateTaskInput } from '../dto/inputs/create.task.input';
import { GQLThrowType, ThrowGQL } from '@app/gqlerr';
import { TaskView } from '../dto/views/task.view.input';
import { parseRequest, parseToView } from '../models/parser';
import { InjectModel } from '@nestjs/mongoose';
import { ObjectId } from 'bson';

@Injectable()
export class CreateTaskService {
  constructor(
    @InjectModel(Task.name)
    private taskModel: Model<Task>,
  ) {}

  async createTask(input: CreateTaskInput): Promise<TaskView> {
    try {
      const parsedResult = parseRequest(input);
      const result = await this.taskModel.create({
        _id: new ObjectId(),
        ...parsedResult,
      });
      return parseToView(result);
    } catch (error) {
      throw new ThrowGQL(error, GQLThrowType.UNPROCESSABLE);
    }
  }
}
