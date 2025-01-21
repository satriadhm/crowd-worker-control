import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Answer, Task } from '../models/task';
import { parseToView } from '../models/parser';
import { sum } from 'mathjs';

@Injectable()
export class CountTaskService {
  constructor(
    @InjectModel(Task.name)
    private taskModel: Model<Task>,
  ) {}

  async countAnswerStat(id: string): Promise<Answer[]> {
    try {
      const task = await this.taskModel.findById(id);
      if (!task) {
        throw new Error('Task not found');
      }

      const parsedTask = parseToView(task);
      const totalWorkers = sum(
        parsedTask.answers.map((answer) => answer.workerId.length),
      );

      parsedTask.answers.forEach((answer) => {
        const answerWorkers = answer.workerId.length;
        answer.stats = totalWorkers > 0 ? answerWorkers / totalWorkers : 0;
      });

      await this.taskModel.updateOne(
        { _id: id },
        { answers: parsedTask.answers },
      );

      return parsedTask.answers;
    } catch (error) {
      console.error('Error calculating answer stats:', error);
      throw error;
    }
  }
}
