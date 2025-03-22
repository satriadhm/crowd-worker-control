import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { RecordedAnswer } from '../../models/recorded';
import { Model } from 'mongoose';
import { ThrowGQL } from '@app/gqlerr';

@Injectable()
export class CreateRecordedService {
  constructor(
    @InjectModel(RecordedAnswer.name)
    private readonly recordedAnswerModel: Model<RecordedAnswer>,
  ) {}

  async createRecordedAnswer(
    taskId: string,
    workerId: string,
    answer: string,
  ): Promise<RecordedAnswer> {
    try {
      return this.recordedAnswerModel.create({ taskId, workerId, answer });
    } catch (error) {
      throw new ThrowGQL('Error in creating recorded answer', error);
    }
  }

  async recordAnswer(
    taskId: string,
    workerId: string,
    answer: string,
  ): Promise<void> {
    await this.createRecordedAnswer(taskId, workerId, answer);
  }
}
