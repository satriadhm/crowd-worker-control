import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { Task } from '../models/task';
import { TaskView } from '../dto/views/task.view.input';
import { GetTaskArgs } from '../dto/args/get.task.args';
import { GQLThrowType, ThrowGQL } from '@app/gqlerr';
import { parseToView } from '../models/parser';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class GetTaskService {
  constructor(
    @InjectModel(Task.name)
    private taskModel: Model<Task>,
  ) {}

  async getTaskById(id: string): Promise<TaskView> {
    try {
      const res = await this.taskModel.findById(id);
      if (!res) {
        throw new ThrowGQL('Task not found', GQLThrowType.NOT_FOUND);
      }
      return parseToView(res);
    } catch (error) {
      throw new ThrowGQL(error, GQLThrowType.UNPROCESSABLE);
    }
  }

  async getTasks(args: GetTaskArgs): Promise<TaskView[]> {
    try {
      const res = await this.taskModel.find().skip(args.skip).limit(args.take);
      return res.map((task) => parseToView(task));
    } catch (error) {
      throw new ThrowGQL(error, GQLThrowType.UNPROCESSABLE);
    }
  }
}
