import { Injectable } from '@nestjs/common';
import { GQLThrowType, ThrowGQL } from '@app/gqlerr';
import { GetTaskService } from 'src/tasks/services/get.task.service';
import { GetElibilityService } from './get.eligibility.service';

@Injectable()
export class TaskAssignmentService {
  constructor(
    private readonly getTaskService: GetTaskService,
    private readonly getElibilityService: GetElibilityService,
  ) {}

  async assignTaskToWorker(taskId: string, workerId: string): Promise<void> {
    const task = await this.getTaskService.getTaskById(taskId);
    if (!task) throw new ThrowGQL('Task not found', GQLThrowType.NOT_FOUND);

    const existingAssignment = await this.getElibilityService.findOne({
      workerId,
      taskIds: taskId,
    });

    if (!existingAssignment) {
      await this.getElibilityService.findOneAndUpdate(
        { workerId },
        {
          $push: { taskIds: taskId },
          $setOnInsert: { answers: [], eligible: false },
        },
        { upsert: true, new: true },
      );
    }
  }
}
