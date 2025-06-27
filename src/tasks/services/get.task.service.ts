import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Model } from 'mongoose';
import { Task } from '../models/task';
import { TaskView } from '../dto/views/task.view.input';
import { GetTaskArgs } from '../dto/args/get.task.args';
import { GQLThrowType, ThrowGQL } from '@app/gqlerr';
import { parseToView } from '../models/parser';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { GetRecordedAnswerService } from 'src/MX/services/recorded/get.recorded.service';

@Injectable()
export class GetTaskService {
  constructor(
    @InjectModel(Task.name)
    private taskModel: Model<Task>,
    @Inject(forwardRef(() => GetRecordedAnswerService))
    private getRecordedAnswerService: GetRecordedAnswerService,
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

  async getTasks(args?: GetTaskArgs): Promise<TaskView[]> {
    try {
      let query = this.taskModel.find();
      if (args?.skip != null) {
        query = query.skip(args.skip);
      }
      if (args?.take != null) {
        query = query.limit(args.take);
      }
      const res = await query;
      return res.map((task) => parseToView(task));
    } catch (error) {
      throw new ThrowGQL(error, GQLThrowType.UNPROCESSABLE);
    }
  }

  async getValidatedTasks(): Promise<TaskView[]> {
    try {
      const tasks = await this.taskModel.find({ isValidQuestion: true });
      return tasks.map((task) => parseToView(task));
    } catch (error) {
      throw new ThrowGQL(error, GQLThrowType.UNPROCESSABLE);
    }
  }

  async getTotalTasks(): Promise<number> {
    try {
      return this.taskModel.countDocuments({ isValidQuestion: true });
    } catch (error) {
      throw new ThrowGQL(error, GQLThrowType.UNPROCESSABLE);
    }
  }

  async getTasksForMXProcessing(): Promise<Task[]> {
    try {
      return this.taskModel.find({ isValidQuestion: true });
    } catch (error) {
      throw new ThrowGQL(error, GQLThrowType.UNPROCESSABLE);
    }
  }

  @Cron('*/10 * * * *')
  async countAnswerStat(): Promise<void> {
    try {
      const tasks = await this.taskModel.find();
      if (!tasks.length) throw new Error('No tasks found');

      for (const task of tasks) {
        const recordedAnswers =
          await this.getRecordedAnswerService.getRecordedAnswer(task._id);
        const totalAnswers = recordedAnswers.length;

        task.answers.forEach((answer) => {
          const count = recordedAnswers.filter(
            (recordedAnswer) => recordedAnswer.answer === answer.answer,
          ).length;
          answer.stats = count / totalAnswers;
        });

        await task.save();
      }
    } catch (error) {
      // Log error but don't throw to prevent cron job from failing
      console.error('Error in countAnswerStat:', error);
    }
  }
}
