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
  private readonly maxIterations = 3; // 3 iterations total

  // Specific timestamps for each iteration based on updated requirements
  private readonly iterationTimes = [
    new Date('2025-04-15T04:00:00'), // Iteration 1 starts at 4:00
    new Date('2025-04-15T05:30:00'), // Iteration 2 starts at 5:30
    new Date('2025-04-15T07:00:00'), // Iteration 3 starts at 7:00
  ];

  // Define end times for each iteration
  private readonly iterationEndTimes = [
    new Date('2025-04-15T05:29:59'), // Iteration 1 ends at 5:29:59
    new Date('2025-04-15T06:59:59'), // Iteration 2 ends at 6:59:59
    new Date('2025-04-15T23:59:59'), // Iteration 3 ends at end of day
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

  /**
   * Determine which iteration we are currently in based on the current time
   */
  private getCurrentIteration(): number {
    const now = new Date();

    // Check which iteration we're in
    if (now >= this.iterationTimes[2]) {
      return 3; // We're in iteration 3 (starting from 7:00)
    } else if (now >= this.iterationTimes[1]) {
      return 2; // We're in iteration 2 (5:30 - 6:59)
    } else if (now >= this.iterationTimes[0]) {
      return 1; // We're in iteration 1 (4:00 - 5:29)
    } else {
      return 0; // We haven't started any iterations yet
    }
  }

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
   * Get metrics for each iteration with the updated time ranges
   */
  private async getIterationMetrics(): Promise<IterationMetric[]> {
    const iterations: IterationMetric[] = [];
    const currentIteration = this.getCurrentIteration();

    // Get total tasks count
    const totalTasks = await this.taskModel.countDocuments();

    // For each iteration that has started, show actual data
    for (let i = 0; i < Math.min(currentIteration, this.maxIterations); i++) {
      const iteration = i + 1;
      const startTime = this.iterationTimes[i];
      const endTime = this.iterationEndTimes[i];

      // Format time range for display
      const timeRange = `${startTime.getHours()}:${startTime.getMinutes().toString().padStart(2, '0')} - ${endTime.getHours()}:${endTime.getMinutes().toString().padStart(2, '0')}`;

      // Count actual workers in this iteration timeframe
      const workerCount = await this.userModel.countDocuments({
        role: Role.WORKER,
        createdAt: {
          $gte: startTime,
          $lte: endTime,
        },
      });

      iterations.push({
        iteration: `Iteration ${iteration} (${timeRange})`,
        workers: workerCount || this.workersPerIteration[i], // Use target count as fallback
        tasks: totalTasks,
      });
    }

    // For iterations that haven't started yet, use projected data
    for (let i = currentIteration; i < this.maxIterations; i++) {
      const iteration = i + 1;
      const startTime = this.iterationTimes[i];
      const endTime = this.iterationEndTimes[i];

      // Format time range for display
      const timeRange = `${startTime.getHours()}:${startTime.getMinutes().toString().padStart(2, '0')} - ${endTime.getHours()}:${endTime.getMinutes().toString().padStart(2, '0')}`;

      iterations.push({
        iteration: `Iteration ${iteration} (${timeRange}) - Upcoming`,
        workers: this.workersPerIteration[i],
        tasks: totalTasks,
      });
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
