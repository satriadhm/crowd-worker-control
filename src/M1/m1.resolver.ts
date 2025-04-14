import { Resolver, Mutation, Args, Query, Context } from '@nestjs/graphql';
import { Roles } from 'src/auth/decorators/role.decorator';
import { Role } from 'src/lib/user.enum';
import { CreateRecordedService } from './services/recorded/create.recorded.service';
import { GetEligibilityService } from './services/eligibility/get.eligibility.service';
import { EligibilityView } from './dto/eligibility/views/eligibility.view';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { UpdateUserService } from '../users/services/update.user.service';
import { CreateRecordedAnswerInput } from './dto/recorded/create.recorded.input';
import {
  AlgorithmPerformanceData,
  TesterAnalysisView,
  TestResultView,
} from './dto/worker-analysis/worker-analysis.view';
import { WorkerAnalysisService } from './services/worker-analysis/worker-analysis.service';
import { DashboardSummary } from './dto/dashboard/dashboard.view';
import { DashboardService } from './services/dashboard/dashboard.service';

@Resolver()
@UseGuards(RolesGuard, JwtAuthGuard)
export class M1Resolver {
  constructor(
    private readonly getEligibilityService: GetEligibilityService,
    private readonly createRecordedService: CreateRecordedService,
    private readonly updateUserService: UpdateUserService,
    private readonly workerAnalysisService: WorkerAnalysisService,
    private readonly dashboardService: DashboardService,
  ) {}

  @Mutation(() => Boolean)
  @Roles(Role.WORKER)
  async submitAnswer(
    @Args('input') input: CreateRecordedAnswerInput,
    @Context() context: any,
  ): Promise<boolean> {
    const workerId = context.req.user.id;
    await this.createRecordedService.recordAnswer(input, workerId);
    await this.updateUserService.userHasDoneTask(input, workerId);
    return true;
  }

  @Query(() => [EligibilityView])
  @Roles(Role.WORKER, Role.ADMIN)
  async getEligibilityHistory(
    @Args('workerId') workerId: string,
  ): Promise<EligibilityView[]> {
    return this.getEligibilityService.getEligibilityWorkerId(workerId);
  }

  // New APIs for Worker Analysis Page

  @Query(() => [AlgorithmPerformanceData])
  @Roles(Role.ADMIN, Role.QUESTION_VALIDATOR)
  async getAlgorithmPerformance(): Promise<AlgorithmPerformanceData[]> {
    return this.workerAnalysisService.getAlgorithmPerformance();
  }

  @Query(() => [TesterAnalysisView])
  @Roles(Role.ADMIN)
  async getTesterAnalysis(): Promise<TesterAnalysisView[]> {
    return this.workerAnalysisService.getTesterAnalysis();
  }

  @Query(() => [TestResultView])
  @Roles(Role.ADMIN)
  async getTestResults(): Promise<TestResultView[]> {
    return this.workerAnalysisService.getTestResults();
  }

  @Query(() => DashboardSummary)
  @Roles(Role.ADMIN, Role.WORKER)
  async getDashboardSummary(): Promise<DashboardSummary> {
    return this.dashboardService.getDashboardSummary();
  }
}
