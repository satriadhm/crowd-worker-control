import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { RecordedAnswer } from '../models/recorded';
import { Model } from 'mongoose';

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
    return this.recordedAnswerModel.create({ taskId, workerId, answer });
  }
}
