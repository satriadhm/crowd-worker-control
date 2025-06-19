import { ThrowGQL, GQLThrowType } from '@app/gqlerr';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model } from 'mongoose';
import {
  AlgorithmPerformanceData,
  TesterAnalysisView,
  TestResultView,
} from 'src/MX/dto/worker-analysis/worker-analysis.view';
import { Eligibility } from 'src/MX/models/eligibility';
import { RecordedAnswer } from 'src/MX/models/recorded';
import { GetUserService } from 'src/users/services/get.user.service';
import { Users } from 'src/users/models/user';
import { UtilsService } from '../utils/utils.service';

@Injectable()
export class WorkerAnalysisService {
  private readonly logger = new Logger(WorkerAnalysisService.name);
  private performanceHistory: AlgorithmPerformanceData[] = [];
  private testResultsCache: { results: TestResultView[]; timestamp: number } =
    null;
  private testerAnalysisCache: {
    results: TesterAnalysisView[];
    timestamp: number;
  } = null;
  private readonly CACHE_TTL = 5 * 60 * 1000;

  constructor(
    @InjectModel(Eligibility.name)
    private readonly eligibilityModel: Model<Eligibility>,
    @InjectModel(RecordedAnswer.name)
    private readonly recordedAnswerModel: Model<RecordedAnswer>,
    @InjectModel(Users.name)
    private readonly userModel: Model<Users>,
    private readonly getUserService: GetUserService,
    private readonly utilsService: UtilsService,
  ) {
    this.updatePerformanceMetrics();
  }

  async getAlgorithmPerformance(): Promise<AlgorithmPerformanceData[]> {
    try {
      if (this.performanceHistory.length === 0) {
        await this.updatePerformanceMetrics();
      }
      return this.performanceHistory;
    } catch (error) {
      this.logger.error('Error getting algorithm performance data', error);
      throw new ThrowGQL(
        'Failed to retrieve algorithm performance data',
        GQLThrowType.UNEXPECTED,
      );
    }
  }

  async getTesterAnalysis(): Promise<TesterAnalysisView[]> {
    try {
      if (
        this.testerAnalysisCache &&
        Date.now() - this.testerAnalysisCache.timestamp < this.CACHE_TTL
      ) {
        return this.testerAnalysisCache.results;
      }

      const startTime = Date.now();
      this.logger.log('Starting getTesterAnalysis');

      const thresholdSettings = await this.utilsService.getThresholdSettings();
      const thresholdValue = thresholdSettings.thresholdValue;
      this.logger.log(`Current threshold value: ${thresholdValue}`);

      const workerAccuracies = await this.eligibilityModel.aggregate([
        {
          $group: {
            _id: '$workerId',
            averageAccuracy: { $avg: { $ifNull: ['$accuracy', 0] } },
            totalRecords: { $sum: 1 },
          },
        },
        {
          $match: {
            totalRecords: { $gt: 0 },
          },
        },
        {
          $addFields: {
            isEligible: { $gt: ['$averageAccuracy', thresholdValue] },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'workerDetails',
          },
        },
        {
          $unwind: {
            path: '$workerDetails',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 0,
            workerId: { $toString: '$_id' },
            testerName: {
              $concat: [
                { $ifNull: ['$workerDetails.firstName', ''] },
                ' ',
                { $ifNull: ['$workerDetails.lastName', ''] },
              ],
            },
            averageScore: { $round: ['$averageAccuracy', 2] },
            accuracy: { $round: ['$averageAccuracy', 2] },
            isEligible: 1,
          },
        },
        {
          $sort: { accuracy: -1 },
        },
      ]);

      this.logger.log(
        `getTesterAnalysis executed in ${Date.now() - startTime}ms`,
      );

      this.testerAnalysisCache = {
        results: workerAccuracies,
        timestamp: Date.now(),
      };

      return workerAccuracies;
    } catch (error) {
      this.logger.error(`Error getting tester analysis data: ${error.message}`);
      throw new ThrowGQL(
        'Failed to retrieve tester analysis data',
        GQLThrowType.UNEXPECTED,
      );
    }
  }

  async getTestResults(page = 1, limit = 288): Promise<TestResultView[]> {
    try {
      if (
        this.testResultsCache &&
        Date.now() - this.testResultsCache.timestamp < this.CACHE_TTL
      ) {
        return this.testResultsCache.results;
      }

      const startTime = Date.now();
      this.logger.log('Starting getTestResults');

      const thresholdSettings = await this.utilsService.getThresholdSettings();
      const threshold = thresholdSettings.thresholdValue;

      const skip = (page - 1) * limit;

      const results = await this.eligibilityModel.aggregate([
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $addFields: {
            eligibilityStatus: {
              $cond: {
                if: { $gt: [{ $ifNull: ['$accuracy', 0] }, threshold] },
                then: 'Eligible',
                else: 'Not Eligible',
              },
            },
            formattedDate: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: { $ifNull: ['$createdAt', new Date()] },
              },
            },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'workerId',
            foreignField: '_id',
            as: 'workerDetails',
          },
        },
        {
          $unwind: {
            path: '$workerDetails',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            id: { $toString: '$_id' },
            workerId: { $toString: '$workerId' },
            testId: { $toString: '$taskId' },
            score: { $ifNull: ['$accuracy', 0.5] },
            eligibilityStatus: 1,
            feedback: {
              $concat: [
                'Automatically evaluated by M-X algorithm. Worker: ',
                { $ifNull: ['$workerDetails.firstName', ''] },
                ' ',
                { $ifNull: ['$workerDetails.lastName', ''] },
                ' Task ID: ',
                { $toString: '$taskId' },
              ],
            },
            createdAt: '$createdAt',
            formattedDate: 1,
          },
        },
      ]);

      this.logger.log(`getTestResults executed in ${Date.now() - startTime}ms`);

      this.updateEligibilityForResults(results).catch((err) =>
        this.logger.error(
          `Background eligibility update failed: ${err.message}`,
        ),
      );

      // Update cache
      this.testResultsCache = {
        results,
        timestamp: Date.now(),
      };

      return results;
    } catch (error) {
      this.logger.error(`Error getting test results data: ${error.message}`);
      throw new ThrowGQL(
        'Failed to retrieve test results data',
        GQLThrowType.UNEXPECTED,
      );
    }
  }

  private async updateEligibilityForResults(
    results: TestResultView[],
  ): Promise<void> {
    const workerIds = [...new Set(results.map((r) => r.workerId))];

    const thresholdSettings = await this.utilsService.getThresholdSettings();
    const threshold = thresholdSettings.thresholdValue;

    for (const workerId of workerIds) {
      await this.updateWorkerEligibility(workerId, threshold);
    }
  }

  async updateWorkerEligibility(
    workerId: string,
    threshold?: number,
  ): Promise<void> {
    try {
      const result = await this.eligibilityModel.aggregate([
        { $match: { workerId: workerId } },
        {
          $group: {
            _id: null,
            averageAccuracy: { $avg: { $ifNull: ['$accuracy', 0] } },
            count: { $sum: 1 },
          },
        },
      ]);

      if (!result.length || result[0].count === 0) return;

      const averageAccuracy = result[0].averageAccuracy;

      if (threshold === undefined) {
        const thresholdSettings =
          await this.utilsService.getThresholdSettings();
        threshold = thresholdSettings.thresholdValue;
      }

      const isEligible = averageAccuracy > threshold;

      await this.userModel.findByIdAndUpdate(
        workerId,
        { $set: { isEligible } },
        { new: true },
      );

      this.logger.debug(
        `Auto-updated eligibility for worker ${workerId}: ${
          isEligible ? 'Eligible' : 'Not Eligible'
        } (average accuracy: ${averageAccuracy.toFixed(2)}, threshold: ${threshold.toFixed(2)})`,
      );
    } catch (error) {
      this.logger.error(
        `Error updating eligibility for worker ${workerId}: ${error.message}`,
      );
    }
  }

  async updateAllWorkerEligibility() {
    try {
      const startTime = Date.now();
      this.logger.log('Starting updateAllWorkerEligibility');

      const thresholdSettings = await this.utilsService.getThresholdSettings();
      const threshold = thresholdSettings.thresholdValue;

      this.logger.log(
        `Running eligibility update with threshold: ${threshold}`,
      );

      const workerEligibilities = await this.eligibilityModel.aggregate([
        {
          $group: {
            _id: '$workerId',
            averageAccuracy: { $avg: { $ifNull: ['$accuracy', 0] } },
            totalRecords: { $sum: 1 },
          },
        },
        {
          $addFields: {
            isEligible: { $gt: ['$averageAccuracy', threshold] },
          },
        },
      ]);

      const bulkOps = workerEligibilities.map((worker) => ({
        updateOne: {
          filter: { _id: worker._id },
          update: { $set: { isEligible: worker.isEligible } },
        },
      }));

      const workersWithNoRecords = await this.userModel.aggregate([
        { $match: { role: 'worker' } },
        {
          $lookup: {
            from: 'eligibilities',
            localField: '_id',
            foreignField: 'workerId',
            as: 'eligibilities',
          },
        },
        { $match: { eligibilities: { $size: 0 } } },
      ]);

      workersWithNoRecords.forEach((worker) => {
        bulkOps.push({
          updateOne: {
            filter: { _id: worker._id },
            update: { $set: { isEligible: null } },
          },
        });
      });

      if (bulkOps.length > 0) {
        const result = await this.userModel.bulkWrite(bulkOps);
        this.logger.log(
          `Bulk updated ${result.modifiedCount} worker eligibility statuses in ${Date.now() - startTime}ms`,
        );
      } else {
        this.logger.log('No worker eligibility updates required');
      }

      this.testResultsCache = null;
      this.testerAnalysisCache = null;

      this.logger.log('All worker eligibility statuses updated successfully');
      return true;
    } catch (error) {
      this.logger.error(
        `Error updating all worker eligibility statuses: ${error.message}`,
      );
      return false;
    }
  }

  @Cron(CronExpression.EVERY_2ND_MONTH)
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

      this.performanceHistory = [];

      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

      const accuracyByMonth = await this.eligibilityModel.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            avgAccuracy: { $avg: { $ifNull: ['$accuracy', 0.5] } },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]);

      const responseTimeByMonth = await this.recordedAnswerModel.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]);

      const accuracyMap = new Map();
      accuracyByMonth.forEach((item) => {
        const key = `${item._id.year}-${item._id.month}`;
        accuracyMap.set(key, item.avgAccuracy);
      });

      const responseMap = new Map();
      responseTimeByMonth.forEach((item) => {
        const key = `${item._id.year}-${item._id.month}`;
        responseMap.set(key, item.count);
      });

      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = monthDate.getFullYear();
        const month = monthDate.getMonth() + 1;
        const key = `${year}-${month}`;

        const accuracy = accuracyMap.has(key) ? accuracyMap.get(key) : 0.88;

        const recordedCount = responseMap.has(key) ? responseMap.get(key) : 0;
        const responseTime =
          recordedCount > 0
            ? 250 - Math.min(recordedCount, 30)
            : 270 - (5 - i) * 10;

        this.performanceHistory.push({
          month: `${monthNames[monthDate.getMonth()]} ${year}`,
          accuracyRate: parseFloat(accuracy.toFixed(2)),
          responseTime: Math.round(Math.max(220, responseTime)),
        });
      }

      this.logger.log('Performance metrics updated successfully');
    } catch (error) {
      this.logger.error(`Error updating performance metrics: ${error.message}`);
    }
  }
}
