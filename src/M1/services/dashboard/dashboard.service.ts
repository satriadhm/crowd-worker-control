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

  private async getIterationMetrics(): Promise<IterationMetric[]> {
    const iterations = [];

    // Get all tasks and divide them evenly across 5 iterations
    const totalTasks = await this.taskModel.countDocuments();
    const tasksPerIteration = Math.ceil(totalTasks / 5);

    // Get all workers with the role 'worker'
    const workers = await this.userModel
      .find({ role: 'worker' })
      .sort({ createdAt: 1 }) // Sort by creation date (oldest first)
      .exec();

    const totalWorkers = workers.length;

    // If we have no workers, provide fallback data
    if (totalWorkers === 0) {
      for (let i = 1; i <= 5; i++) {
        iterations.push({
          iteration: `Iteration ${i}`,
          workers: 5 * i, // Simulated growth
          tasks: tasksPerIteration,
        });
      }
      return iterations;
    }

    // Calculate how many workers to include in each iteration
    const workersPerBatch = Math.ceil(totalWorkers / 5);

    // For each iteration, include workers who joined up to that point
    for (let i = 1; i <= 5; i++) {
      const currentWorkerCount = Math.min(workersPerBatch * i, totalWorkers);

      iterations.push({
        iteration: `Iteration ${i}`,
        workers: currentWorkerCount,
        tasks: tasksPerIteration,
      });
    }

    return iterations;
  }

  private async getWorkerEligibilityDistribution(): Promise<
    StatusDistribution[]
  > {
    // Count eligible and non-eligible workers
    const eligibleCount = await this.userModel.countDocuments({
      role: 'worker',
      isEligible: true,
    });

    const totalWorkers = await this.userModel.countDocuments({
      role: 'worker',
    });
    const nonEligibleCount = totalWorkers - eligibleCount;

    return [
      { name: 'Eligible', value: eligibleCount },
      { name: 'Not Eligible', value: nonEligibleCount },
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
    // Group workers by accuracy ranges
    const eligibilityRecords = await this.eligibilityModel.find().exec();

    // Count workers in each accuracy bracket
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
      value,
    }));
  }
}
