import { ThrowGQL, GQLThrowType } from '@app/gqlerr';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model } from 'mongoose';
import {
  AlgorithmPerformanceData,
  TesterAnalysisView,
  TestResultView,
} from 'src/M1/dto/worker-analysis/worker-analysis.view';
import { Eligibility } from 'src/M1/models/eligibility';
import { RecordedAnswer } from 'src/M1/models/recorded';
import { GetUserService } from 'src/users/services/get.user.service';

@Injectable()
export class WorkerAnalysisService {
  private readonly logger = new Logger(WorkerAnalysisService.name);
  private performanceHistory: AlgorithmPerformanceData[] = [];
  private readonly startDate = new Date('2025-01-01');

  constructor(
    @InjectModel(Eligibility.name)
    private readonly eligibilityModel: Model<Eligibility>,
    @InjectModel(RecordedAnswer.name)
    private readonly recordedAnswerModel: Model<RecordedAnswer>,
    private readonly getUserService: GetUserService,
  ) {
    // Initialize performance history with sample data
    this.initializePerformanceHistory();
  }

  private initializePerformanceHistory() {
    // Create simulated algorithm performance data for the past 6 months
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const baseAccuracy = 0.88;
    const baseResponseTime = 270;

    this.performanceHistory = months.map((month, idx) => {
      // Simulate gradual improvement in algorithm performance
      const improvement = idx * 0.015;
      const speedImprovement = idx * 10;

      return {
        month,
        accuracyRate: Math.min(0.99, baseAccuracy + improvement),
        responseTime: Math.max(220, baseResponseTime - speedImprovement),
      };
    });
  }

  // Get algorithm performance data for visualization
  async getAlgorithmPerformance(): Promise<AlgorithmPerformanceData[]> {
    try {
      return this.performanceHistory;
    } catch (error) {
      this.logger.error('Error getting algorithm performance data', error);
      throw new ThrowGQL(
        'Failed to retrieve algorithm performance data',
        GQLThrowType.UNEXPECTED,
      );
    }
  }

  // Get worker performance analysis
  async getTesterAnalysis(): Promise<TesterAnalysisView[]> {
    try {
      // Get all eligibility records
      const eligibilities = await this.eligibilityModel.find().exec();

      // Group by worker
      const workerMap = new Map<
        string,
        {
          scores: number[];
          name: string;
          workerId: string;
        }
      >();

      // Process each eligibility record
      for (const eligibility of eligibilities) {
        const workerId = eligibility.workerId.toString();

        // Get worker details using the user service instead of populate
        const worker = await this.getUserService.getUserById(workerId);
        const workerName = worker
          ? `${worker.firstName} ${worker.lastName}`
          : 'Unknown Worker';

        if (!workerMap.has(workerId)) {
          workerMap.set(workerId, {
            scores: [],
            name: workerName,
            workerId,
          });
        }

        if (eligibility.accuracy) {
          workerMap.get(workerId).scores.push(eligibility.accuracy);
        }
      }

      // Calculate average scores and format response
      const result: TesterAnalysisView[] = [];
      workerMap.forEach(({ scores, name, workerId }) => {
        if (scores.length === 0) return;

        const averageScore =
          scores.reduce((sum, score) => sum + score, 0) / scores.length;
        // Calculate a "normalized" accuracy that scales the average score to a comparable value
        const accuracy = 0.5 + averageScore * 0.5; // Scale between 0.5 and 1.0

        result.push({
          workerId,
          testerName: name,
          averageScore: parseFloat(averageScore.toFixed(2)),
          accuracy: parseFloat(accuracy.toFixed(2)),
        });
      });

      return result;
    } catch (error) {
      this.logger.error('Error getting tester analysis data', error);
      throw new ThrowGQL(
        'Failed to retrieve tester analysis data',
        GQLThrowType.UNEXPECTED,
      );
    }
  }

  // Get test results for visualization
  // Get test results for visualization
  async getTestResults(): Promise<TestResultView[]> {
    try {
      // Get eligibility records
      const eligibilities = await this.eligibilityModel
        .find()
        .sort({ createdAt: -1 })
        .limit(50)
        .exec();

      const results: TestResultView[] = [];

      // Process each eligibility record
      for (const eligibility of eligibilities) {
        // Get worker details
        const worker = await this.getUserService.getUserById(
          eligibility.workerId.toString(),
        );

        // Include worker name in feedback if available
        const workerInfo = worker
          ? `Worker: ${worker.firstName} ${worker.lastName}`
          : '';

        results.push({
          id: eligibility._id.toString(),
          workerId: eligibility.workerId.toString(),
          testId: eligibility.taskId.toString(),
          score: eligibility.accuracy || 0.5,
          feedback: `Automatically evaluated by M-X algorithm. ${workerInfo} Task ID: ${eligibility.taskId.toString()}`,
          createdAt: eligibility.createdAt,
        });
      }

      return results;
    } catch (error) {
      this.logger.error('Error getting test results data', error);
      throw new ThrowGQL(
        'Failed to retrieve test results data',
        GQLThrowType.UNEXPECTED,
      );
    }
  }

  // Update performance metrics periodically
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async updatePerformanceMetrics() {
    try {
      const now = new Date();
      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      const currentMonth = monthNames[now.getMonth()];

      // Check if we already have an entry for the current month
      const existingEntryIndex = this.performanceHistory.findIndex(
        (entry) => entry.month === currentMonth,
      );

      // Generate new performance metrics based on recent data
      // For this example, we're simulating metrics calculation

      // Simulate some complex calculation
      const recentEligibilities = await this.eligibilityModel
        .find({
          createdAt: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) },
        })
        .exec();

      // Calculate accuracy from recent data (or use a default improvement)
      const accuracies = recentEligibilities.map((e) => e.accuracy || 0.5);
      const avgAccuracy =
        accuracies.length > 0
          ? accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length
          : 0.9 + Math.random() * 0.05; // Default with slight randomization

      // Calculate response time (simulated)
      const simulatedResponseTime = Math.max(210, 250 - Math.random() * 30);

      const newMetrics = {
        month: currentMonth,
        accuracyRate: parseFloat(avgAccuracy.toFixed(2)),
        responseTime: Math.round(simulatedResponseTime),
      };

      if (existingEntryIndex >= 0) {
        // Update existing entry
        this.performanceHistory[existingEntryIndex] = newMetrics;
      } else {
        // Add new entry and keep only the last 6 months
        this.performanceHistory.push(newMetrics);
        if (this.performanceHistory.length > 6) {
          this.performanceHistory.shift();
        }
      }

      this.logger.log(
        `Updated algorithm performance metrics for ${currentMonth}`,
      );
    } catch (error) {
      this.logger.error('Error updating performance metrics', error);
    }
  }
}
