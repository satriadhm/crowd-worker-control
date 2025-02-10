import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { RecordedAnswer } from '../models/recorded';
import { Model } from 'mongoose';
@Injectable()
export class GetRecordedAnswerService {
  constructor(
    @InjectModel(RecordedAnswer.name)
    private readonly recordedAnswerModel: Model<RecordedAnswer>,
  ) {}

  async getRecordedAnswer(taskId: string): Promise<RecordedAnswer[]> {
    return this.recordedAnswerModel.find({ taskId });
  }

  async getRecordedAnswerByWorkerId(
    workerId: string,
  ): Promise<RecordedAnswer[]> {
    return this.recordedAnswerModel.find({ workerId });
  }
}
