// src/M1/services/dashboard/dashboard.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task } from 'src/tasks/models/task';
import { Users } from 'src/users/models/user';
import { Eligibility } from 'src/M1/models/eligibility';
import {
  DashboardSummary,
  IterationMetric,
  StatusDistribution,
  AccuracyDistribution,
} from '../../dto/dashboard/dashboard.view';
import { Role } from 'src/lib/user.enum';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);
  private readonly maxIterations = 3; // Modified to match your requirements - 3 iterations

  // Specific timestamps for each iteration
  private readonly iterationTimes = [
    new Date('2025-04-15T11:00:00'), // Iteration 1 - 11:00
    new Date('2025-04-15T12:30:00'), // Iteration 2 - 12:30
    new Date('2025-04-15T14:00:00'), // Iteration 3 - 14:00
  ];

  // Worker counts for each iteration
  private readonly workersPerIteration = [3, 6, 9]; // Target worker counts per iteration

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
      // Get iteration metrics
      const iterationMetrics = await this.getIterationMetrics();

      // Get worker eligibility distribution
      const workerEligibility = await this.getWorkerEligibilityDistribution();

      // Get task validation distribution
      const taskValidation = await this.getTaskValidationDistribution();

      // Get accuracy distribution
      const accuracyDistribution = await this.getAccuracyDistribution();

      return {
        iterationMetrics,
        workerEligibility,
        taskValidation,
        accuracyDistribution,
      };
    } catch (error) {
      this.logger.error(`Error fetching dashboard summary: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get metrics for each iteration with fixed times and worker counts
   */
  private async getIterationMetrics(): Promise<IterationMetric[]> {
    const iterations: IterationMetric[] = [];

    // Get total tasks count
    const totalTasks = await this.taskModel.countDocuments();

    // Get same task count for each iteration
    const tasksPerIteration = totalTasks;

    // Create data for each iteration with fixed worker counts
    for (let i = 0; i < this.maxIterations; i++) {
      const iteration = i + 1;
      const formattedTime = this.iterationTimes[i].toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      iterations.push({
        iteration: `Iteration ${iteration} (${formattedTime})`,
        workers: this.workersPerIteration[i],
        tasks: tasksPerIteration,
      });

      this.logger.log(
        `Iteration ${iteration}: Time=${formattedTime}, Workers=${this.workersPerIteration[i]}, Tasks=${tasksPerIteration}`,
      );
    }

    return iterations;
  }

  private async getWorkerEligibilityDistribution(): Promise<
    StatusDistribution[]
  > {
    // Count workers by eligibility status
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
    // Count validated and non-validated tasks
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
    // Get all workers with eligibility records
    const eligibilityRecords = await this.eligibilityModel.find().exec();

    // Group workers by their accuracy ranges
    const accuracyBrackets = {
      '90-100%': 0,
      '80-89%': 0,
      '70-79%': 0,
      'Below 70%': 0,
    };

    // Process each eligibility record
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

    // Convert to array format
    return Object.entries(accuracyBrackets).map(([name, value]) => ({
      name,
      value: value || 0, // Ensure no null values
    }));
  }
}
