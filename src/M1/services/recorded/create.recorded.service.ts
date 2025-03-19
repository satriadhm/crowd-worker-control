import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { RecordedAnswer } from '../../models/recorded';
import { Model } from 'mongoose';
import { GetElibilityService } from '../eligibility/get.eligibility.service';

@Injectable()
export class CreateRecordedService {
  constructor(
    @InjectModel(RecordedAnswer.name)
    private readonly recordedAnswerModel: Model<RecordedAnswer>,
    private readonly getElibilityService: GetElibilityService,
  ) {}

  async createRecordedAnswer(
    taskId: string,
    workerId: string,
    answer: string,
  ): Promise<RecordedAnswer> {
    return this.recordedAnswerModel.create({ taskId, workerId, answer });
  }

  async recordAnswer(
    taskId: string,
    workerId: string,
    answer: string,
  ): Promise<void> {
    await this.getElibilityService.getElibilityAndUpdate(taskId, {
      $addToSet: { workerIds: workerId },
    });

    await this.createRecordedAnswer(taskId, workerId, answer);
  }
}
