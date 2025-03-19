import { GetTaskService } from './../tasks/services/get.task.service';
import { Resolver, Mutation, Args, Query, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { Roles } from 'src/auth/decorators/role.decorator';
import { Role } from 'src/lib/user.enum';
import { AccuracyCalculationService } from './services/accuracy.calculation.service';
import { EligibilityUpdateService } from './services/eligibility/update.eligibility.service';
import { CreateRecordedService } from './services/recorded/create.recorded.service';
import { GetElibilityService } from './services/eligibility/get.eligibility.service';
import { EligibilityView } from './dto/eligibility/views/eligibility.view';

@Resolver()
@UseGuards(JwtAuthGuard, RolesGuard)
export class M1Resolver {
  constructor(
    private readonly accuracyCalculationService: AccuracyCalculationService,
    private readonly eligibilityUpdateService: EligibilityUpdateService,
    private readonly getTaskService: GetTaskService,
    private readonly GetElibilityService: GetElibilityService,
    private readonly createRecordedService: CreateRecordedService,
  ) {}

  @Mutation(() => Boolean)
  @Roles(Role.WORKER)
  async submitAnswer(
    @Args('taskId') taskId: string,
    @Args('answer') answer: string,
    @Context() context: any,
  ): Promise<boolean> {
    const workerId = context.req.user.id;
    await this.createRecordedService.recordAnswer(taskId, workerId, answer);
    return true;
  }

  @Query(() => [EligibilityView])
  @Roles(Role.WORKER, Role.ADMIN)
  async getEligibilityHistory(
    @Args('taskId') taskId: string,
    @Args('workerId') workerId: string,
  ): Promise<EligibilityView[]> {
    return this.GetElibilityService.getEligibilityHistoryWorkerId(workerId);
  }

  @Query(() => [String])
  @Roles(Role.ADMIN)
  async calculateEligibility(
    @Args('taskId') taskId: string,
    @Args('workerIds', { type: () => [String] }) workersId: string[],
  ): Promise<string[]> {
    const task = await this.getTaskService.getTaskById(taskId);
    if (!task) throw new Error('Task not found');
    const m = task.answers.length;
    const accuracies = await this.accuracyCalculationService.calculateAccuracy(
      taskId,
      workersId,
      m,
      3,
    );
    await this.eligibilityUpdateService.updateEligibility(taskId, accuracies);

    const eligibleWorkers = Object.entries(accuracies)
      .filter(([, accuracy]) => accuracy >= 0.7)
      .map(([workerId]) => workerId);

    return eligibleWorkers;
  }
}
