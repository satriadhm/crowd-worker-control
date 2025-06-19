// src/MX/services/dashboard/dashboard.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task } from 'src/tasks/models/task';
import { Users } from 'src/users/models/user';
import { Eligibility } from 'src/MX/models/eligibility';
import {
  DashboardSummary,
  StatusDistribution,
  AccuracyDistribution,
} from '../../dto/dashboard/dashboard.view';
import { Role } from 'src/lib/user.enum';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectModel(Task.name)
    private readonly taskModel: Model<Task>,
    @InjectModel(Users.name)
    private readonly userModel: Model<Users>,
    @InjectModel(Eligibility.name)
    private readonly eligibilityModel: Model<Eligibility>,
  ) {}

  async getDashboardSummary(): Promise<DashboardSummary> {
    try {
      const workerEligibility = await this.getWorkerEligibilityDistribution();

      const taskValidation = await this.getTaskValidationDistribution();

      const accuracyDistribution = await this.getAccuracyDistribution();

      return {
        iterationMetrics: [],
        workerEligibility,
        taskValidation,
        accuracyDistribution,
      };
    } catch (error) {
      this.logger.error(`Error fetching dashboard summary: ${error.message}`);
      throw error;
    }
  }

  private async getWorkerEligibilityDistribution(): Promise<
    StatusDistribution[]
  > {
    const eligibleCount = await this.userModel.countDocuments({
      role: Role.WORKER,
      isEligible: true,
    });

    const nonEligibleCount = await this.userModel.countDocuments({
      role: Role.WORKER,
      isEligible: false,
    });

    const pendingCount = await this.userModel.countDocuments({
      role: Role.WORKER,
      isEligible: null,
    });

    this.logger.log(
      `Worker eligibility stats: Eligible=${eligibleCount}, Non-Eligible=${nonEligibleCount}, Pending=${pendingCount}`,
    );

    return [
      { name: 'Eligible', value: eligibleCount },
      { name: 'Not Eligible', value: nonEligibleCount },
      { name: 'Pending', value: pendingCount },
    ];
  }

  private async getTaskValidationDistribution(): Promise<StatusDistribution[]> {
    const validatedCount = await this.taskModel.countDocuments({
      isValidQuestion: true,
    });
    const totalTasks = await this.taskModel.countDocuments();
    const nonValidatedCount = totalTasks - validatedCount;

    return [
      { name: 'Validated', value: validatedCount },
      { name: 'Not Validated', value: nonValidatedCount },
    ];
  }

  private async getAccuracyDistribution(): Promise<AccuracyDistribution[]> {
    const eligibilityRecords = await this.eligibilityModel.find().exec();

    const accuracyBrackets = {
      '90-100%': 0,
      '80-89%': 0,
      '70-79%': 0,
      'Below 70%': 0,
    };

    for (const record of eligibilityRecords) {
      const accuracy = record.accuracy || 0;

      if (accuracy >= 0.9) {
        accuracyBrackets['90-100%']++;
      } else if (accuracy >= 0.8) {
        accuracyBrackets['80-89%']++;
      } else if (accuracy >= 0.7) {
        accuracyBrackets['70-79%']++;
      } else {
        accuracyBrackets['Below 70%']++;
      }
    }

    return Object.entries(accuracyBrackets).map(([name, value]) => ({
      name,
      value: value || 0,
    }));
  }
}
