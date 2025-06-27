// src/MX/mx.resolver.ts

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
import { ThresholdType, Utils } from './models/utils';
import { UtilsService } from './services/utils/utils.service';
import { ThresholdSettingsInput } from './dto/utils/create.utils.input';
import { AccuracyCalculationServiceMX } from './services/mx/mx.calculation.service';

@Resolver()
@UseGuards(RolesGuard, JwtAuthGuard)
export class M1Resolver {
  constructor(
    private readonly getEligibilityService: GetEligibilityService,
    private readonly createRecordedService: CreateRecordedService,
    private readonly updateUserService: UpdateUserService,
    private readonly workerAnalysisService: WorkerAnalysisService,
    private readonly dashboardService: DashboardService,
    private readonly utilsService: UtilsService,
    private readonly accuracyCalculationService: AccuracyCalculationServiceMX,
  ) {}

  @Mutation(() => Boolean)
  @Roles(Role.WORKER)
  async submitAnswer(
    @Args('input') input: CreateRecordedAnswerInput,
    @Context() context: any,
  ): Promise<boolean> {
    const workerId = context.req.user.id;

    // Record answer and automatically trigger M-X processing
    await this.createRecordedService.recordAnswer(input, workerId);

    // Update user task completion history
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

  // Worker Analysis APIs
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

  @Query(() => Utils)
  @Roles(Role.ADMIN)
  async getThresholdSettings(): Promise<Utils> {
    return this.utilsService.getThresholdSettings();
  }

  @Mutation(() => Utils)
  @Roles(Role.ADMIN)
  async updateThresholdSettings(
    @Args('input') input: ThresholdSettingsInput,
  ): Promise<Utils> {
    return this.utilsService.updateThresholdSettings(
      input.thresholdType as ThresholdType,
      input.thresholdValue,
    );
  }

  @Mutation(() => Boolean)
  @Roles(Role.ADMIN)
  async triggerEligibilityUpdate(): Promise<boolean> {
    try {
      await this.workerAnalysisService.updateAllWorkerEligibility();
      return true;
    } catch (error) {
      return false;
    }
  }

  // DEBUGGING ENDPOINTS - Remove in production
  @Query(() => String)
  @Roles(Role.ADMIN)
  async getBatchStatus(@Args('taskId') taskId: string): Promise<string> {
    const status = this.accuracyCalculationService.getBatchStatus(taskId);
    return JSON.stringify(status, null, 2);
  }

  @Mutation(() => Boolean)
  @Roles(Role.ADMIN)
  async resetBatchTracker(@Args('taskId') taskId: string): Promise<boolean> {
    try {
      this.accuracyCalculationService.resetBatchTracker(taskId);
      return true;
    } catch (error) {
      return false;
    }
  }

  @Mutation(() => Boolean)
  @Roles(Role.ADMIN)
  async triggerBatchProcessing(
    @Args('taskId') taskId: string,
    @Args('workerId') workerId: string,
  ): Promise<boolean> {
    try {
      await this.accuracyCalculationService.processWorkerSubmission(
        taskId,
        workerId,
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  @Query(() => String)
  @Roles(Role.ADMIN)
  async debugEligibilityIssue(): Promise<string> {
    try {
      // Get basic stats
      const eligibilityRecords =
        await this.getEligibilityService.getEligibility();
      const currentTrackers =
        this.accuracyCalculationService.getBatchStatus('all');

      const result = {
        eligibilityRecordsCount: eligibilityRecords.length,
        eligibilityRecords: eligibilityRecords.slice(0, 10), // Only first 10 records
        batchTrackersStatus: currentTrackers,
        message:
          'If eligibilityRecordsCount is 0, then M-X algorithm has not processed any workers yet',
      };

      return JSON.stringify(result, null, 2);
    } catch (error) {
      return `Error: ${error.message}`;
    }
  }

  @Mutation(() => String)
  @Roles(Role.ADMIN)
  async triggerManualMXProcessing(): Promise<string> {
    try {
      await this.accuracyCalculationService.processAllTasksForCompletedWorkers();
      return 'M-X processing triggered successfully';
    } catch (error) {
      return `Error triggering M-X processing: ${error.message}`;
    }
  }

  @Mutation(() => String)
  @Roles(Role.ADMIN)
  async fixEligibilityIssue(): Promise<string> {
    try {
      const fixedIssues = [];

      // 1. Trigger M-X processing manually
      await this.accuracyCalculationService.processAllTasksForCompletedWorkers();
      fixedIssues.push('Triggered M-X processing for all completed workers');

      // 2. Trigger eligibility update
      await this.triggerEligibilityUpdate();
      fixedIssues.push('Triggered eligibility status update');

      return `Fixed issues: ${fixedIssues.join(', ')}`;
    } catch (error) {
      return `Error fixing eligibility issue: ${error.message}`;
    }
  }
}
