// src/M1/services/task-assignment.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Eligibility } from '../models/eligibility';
import { GQLThrowType, ThrowGQL } from '@app/gqlerr';
import { CreateRecordedService } from './create.recorded.service';
import { GetTaskService } from 'src/tasks/services/get.task.service';

@Injectable()
export class TaskAssignmentService {
  constructor(
    private readonly getTaskService: GetTaskService,
    private readonly createRecordedService: CreateRecordedService,
    @InjectModel(Eligibility.name)
    private readonly eligibilityModel: Model<Eligibility>,
  ) {}

  async assignTaskToWorker(taskId: string, workerId: string): Promise<void> {
    const task = await this.getTaskService.getTaskById(taskId);
    if (!task) throw new ThrowGQL('Task not found', GQLThrowType.NOT_FOUND);

    const existingAssignment = await this.eligibilityModel.findOne({
      workerId,
      taskIds: taskId,
    });

    if (!existingAssignment) {
      await this.eligibilityModel.create({
        taskIds: [taskId],
        workerId,
        answers: [],
        eligible: false,
      });
    }
  }

  async recordAnswer(
    taskId: string,
    workerId: string,
    answer: string,
  ): Promise<void> {
    await this.eligibilityModel.findOneAndUpdate(
      { taskIds: taskId, workerId },
      { $push: { answers: { taskId, workerId, answer } } },
      { upsert: true, new: true },
    );

    await this.createRecordedService.createRecordedAnswer(
      taskId,
      workerId,
      answer,
    );
  }
}
