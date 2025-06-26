import { ThrowGQL, GQLThrowType } from '@app/gqlerr';
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

    // Check if user has completed ALL tasks before triggering M-X algorithm
    const user = await this.userModel.findById(workerId);
    if (!user) {
      throw new ThrowGQL('User not found', GQLThrowType.NOT_FOUND);
    }

    const totalTasks = await this.getTaskService.getTotalTasks();
    const completedTasksCount = user.completedTasks?.length || 0;

    this.logger.log(
      `Worker ${workerId}: completed ${completedTasksCount}/${totalTasks} tasks`,
    );

    // Only trigger M-X algorithm if user has completed ALL tasks
    if (completedTasksCount >= totalTasks) {
      this.logger.log(
        `Worker ${workerId} has completed all tasks. Triggering M-X algorithm...`,
      );

      // Now trigger M-X processing since this worker completed all tasks
      await this.accuracyCalculationService.processWorkerSubmission(
        taskId,
        workerId,
      );
    } else {
      this.logger.log(
        `Worker ${workerId} still has ${totalTasks - completedTasksCount} tasks remaining. Skipping M-X algorithm.`,
      );
    }
  }
}
