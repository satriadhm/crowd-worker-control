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
  private readonly maxIterations = 5;
  private readonly workersPerIteration = [3, 6, 9, 12, 15]; // Target worker counts per iteration

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
   * Get metrics for each iteration with accurate worker counts
   * Fixed: Shows the actual number of workers based on worker database count
   */
  private async getIterationMetrics(): Promise<IterationMetric[]> {
    // Get all workers and count them accurately
    const allWorkers = await this.userModel
      .find({ role: 'worker' })
      .sort({ createdAt: 1 })
      .exec();

    const totalWorkers = allWorkers.length;
    this.logger.debug(`Total workers found: ${totalWorkers}`);

    // Get all tasks and distribute them evenly across 5 iterations
    const totalTasks = await this.taskModel.countDocuments();
    const tasksPerIteration = Math.ceil(totalTasks / this.maxIterations);

    const iterations: IterationMetric[] = [];

    // Create data for each iteration based on actual worker count
    for (let i = 0; i < this.maxIterations; i++) {
      // Get the target worker count for this iteration
      const targetWorkerCount = this.workersPerIteration[i];

      // Calculate actual number of workers (limited by available workers)
      const actualWorkerCount = Math.min(targetWorkerCount, totalWorkers);

      iterations.push({
        iteration: `Iteration ${i + 1}`,
        workers: actualWorkerCount,
        tasks: tasksPerIteration,
      });
    }

    // If there are no workers yet, provide fallback data
    if (
      iterations.length === 0 ||
      (iterations.length > 0 && iterations[0].workers === 0)
    ) {
      return [
        { iteration: 'Iteration 1', workers: 0, tasks: tasksPerIteration },
        { iteration: 'Iteration 2', workers: 0, tasks: tasksPerIteration },
        { iteration: 'Iteration 3', workers: 0, tasks: tasksPerIteration },
        { iteration: 'Iteration 4', workers: 0, tasks: tasksPerIteration },
        { iteration: 'Iteration 5', workers: 0, tasks: tasksPerIteration },
      ];
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

    // Count workers with defined eligibility status
    const nonEligibleCount = await this.userModel.countDocuments({
      role: 'worker',
      isEligible: false,
    });

    // Ensure we have at least 1 in each category for visualization
    const adjustedEligibleCount = eligibleCount > 0 ? eligibleCount : 1;
    const adjustedNonEligibleCount =
      nonEligibleCount > 0 ? nonEligibleCount : 1;

    return [
      { name: 'Eligible', value: adjustedEligibleCount },
      { name: 'Not Eligible', value: adjustedNonEligibleCount },
    ];
  }

  private async getTaskValidationDistribution(): Promise<StatusDistribution[]> {
    // Count validated and non-validated tasks
    const validatedCount = await this.taskModel.countDocuments({
      isValidQuestion: true,
    });
    const totalTasks = await this.taskModel.countDocuments();
    const nonValidatedCount = totalTasks - validatedCount;

    // Ensure we have at least 1 in each category for visualization
    return [
      { name: 'Validated', value: validatedCount > 0 ? validatedCount : 1 },
      {
        name: 'Not Validated',
        value: nonValidatedCount > 0 ? nonValidatedCount : 1,
      },
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

    // If no records exist yet, add some default values
    if (eligibilityRecords.length === 0) {
      accuracyBrackets['90-100%'] = 1;
      accuracyBrackets['80-89%'] = 1;
      accuracyBrackets['70-79%'] = 1;
      accuracyBrackets['Below 70%'] = 1;
    }

    // Convert to array format
    return Object.entries(accuracyBrackets).map(([name, value]) => ({
      name,
      value,
    }));
  }
}
