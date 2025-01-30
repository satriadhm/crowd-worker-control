// src/M1/services/task-assignment.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task } from 'src/tasks/models/task';
import { RecordedAnswer } from '../models/recorded';
import { Eligibility } from '../models/eligibility';

@Injectable()
export class TaskAssignmentService {
  constructor(
    @InjectModel(Task.name) private readonly taskModel: Model<Task>,
    @InjectModel(RecordedAnswer.name)
    private readonly recordedAnswerModel: Model<RecordedAnswer>,
    @InjectModel(Eligibility.name)
    private readonly eligibilityModel: Model<Eligibility>,
  ) {}

  async assignTaskToWorker(taskId: string, workerId: string): Promise<void> {
    const task = await this.taskModel.findById(taskId);
    if (!task) throw new Error('Task not found');

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
      { taskId, workerId },
      { $set: { answer } },
      { upsert: true, new: true },
    );

    await this.recordedAnswerModel.create({ taskId, workerId, answer });
  }
}
