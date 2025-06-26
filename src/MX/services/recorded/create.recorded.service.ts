import { ThrowGQL } from '@app/gqlerr';
import { Injectable, Inject, forwardRef, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RecordedAnswer } from 'src/MX/models/recorded';
import { GetTaskService } from 'src/tasks/services/get.task.service';
import { CreateRecordedAnswerInput } from '../../dto/recorded/create.recorded.input';
import { AccuracyCalculationServiceMX } from '../mx/mx.calculation.service';
import { Users } from 'src/users/models/user';

@Injectable()
export class CreateRecordedService {
  private readonly logger = new Logger(CreateRecordedService.name);

  constructor(
    @InjectModel(RecordedAnswer.name)
    private readonly recordedAnswerModel: Model<RecordedAnswer>,
    @InjectModel(Users.name)
    private readonly userModel: Model<Users>,
    @Inject(forwardRef(() => GetTaskService))
    private readonly getTaskService: GetTaskService,
    @Inject(forwardRef(() => AccuracyCalculationServiceMX))
    private readonly accuracyCalculationService: AccuracyCalculationServiceMX,
  ) {}

  async createRecordedAnswer(
    taskId: string,
    workerId: string,
    answerId: number,
  ): Promise<RecordedAnswer> {
    try {
      const task = await this.getTaskService.getTaskById(taskId);
      const answerText =
        task?.answers.find((a) => a.answerId === answerId)?.answer || '';

      const recordedAnswer = await this.recordedAnswerModel.create({
        taskId,
        workerId,
        answerId,
        answer: answerText,
      });

      this.logger.log(
        `Answer recorded for worker ${workerId} on task ${taskId}`,
      );
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

    // First, record the answer
    await this.createRecordedAnswer(taskId, workerId, answerId);

    this.logger.log(
      `Answer recorded for worker ${workerId} on task ${taskId} with answerId ${answerId}`,
    );

    // Always trigger M-X processing after recording answer
    // The M-X service will handle checking if enough workers have completed all tasks
    try {
      await this.accuracyCalculationService.processWorkerSubmission(
        taskId,
        workerId,
      );
      this.logger.log(
        `M-X processing triggered for worker ${workerId} on task ${taskId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error triggering M-X processing for worker ${workerId} on task ${taskId}: ${error.message}`,
      );
      // Don't throw error here to avoid breaking the answer recording
    }
  }
}
