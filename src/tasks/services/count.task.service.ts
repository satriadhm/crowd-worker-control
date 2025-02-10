import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GetRecordedAnswerService } from 'src/M1/services/get.recorded.service';
import { Task } from '../models/task';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class CountTaskService {
  constructor(
    @InjectModel(Task.name)
    private taskModel: Model<Task>,
    private getRecordedAnswerService: GetRecordedAnswerService,
  ) {}

  @Cron('*/10 * * * *')
  async countAnswerStat(): Promise<void> {
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

      // Update the task with the new answer stats
      await task.save();
    }
  }
}
