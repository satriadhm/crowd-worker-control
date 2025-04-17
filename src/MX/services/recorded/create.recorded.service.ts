// src/MX/services/recorded/create.recorded.service.ts
import { ThrowGQL } from '@app/gqlerr';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RecordedAnswer } from 'src/MX/models/recorded';
import { GetTaskService } from 'src/tasks/services/get.task.service';
import { CreateRecordedAnswerInput } from '../../dto/recorded/create.recorded.input';
import { WorkerAnalysisService } from '../worker-analysis/worker-analysis.service';

@Injectable()
export class CreateRecordedService {
  constructor(
    @InjectModel(RecordedAnswer.name)
    private readonly recordedAnswerModel: Model<RecordedAnswer>,
    private readonly getTaskService: GetTaskService,
    private readonly workerAnalysisService: WorkerAnalysisService,
  ) {}

  async createRecordedAnswer(
    taskId: string,
    workerId: string,
    answerId: number,
  ): Promise<RecordedAnswer> {
    try {
      // Optionally fetch the task to get the text answer for reference
      const task = await this.getTaskService.getTaskById(taskId);
      const answerText =
        task?.answers.find((a) => a.answerId === answerId)?.answer || '';

      const recordedAnswer = await this.recordedAnswerModel.create({
        taskId,
        workerId,
        answerId,
        answer: answerText, // Store the text for reference
      });

      // Trigger eligibility update after recording the answer
      await this.workerAnalysisService.updateWorkerEligibility(workerId);

      return recordedAnswer;
    } catch (error) {
      throw new ThrowGQL('Error in creating recorded answer', error);
    }
  }

  async recordAnswer(
    input: CreateRecordedAnswerInput,
    workerId: string,
  ): Promise<void> {
    const answerId = input.answerId;
    const taskId = input.taskId;
    await this.createRecordedAnswer(taskId, workerId, answerId);
  }
}
