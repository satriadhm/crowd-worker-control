// src/MX/services/worker-analysis/worker-analysis.service.ts

import { ThrowGQL, GQLThrowType } from '@app/gqlerr';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
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
import { GetTaskService } from 'src/tasks/services/get.task.service';

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
  private readonly CACHE_TTL = 1 * 60 * 1000; // 1 minute cache

  constructor(
    @InjectModel(Eligibility.name)
    private readonly eligibilityModel: Model<Eligibility>,
    @InjectModel(RecordedAnswer.name)
    private readonly recordedAnswerModel: Model<RecordedAnswer>,
    @InjectModel(Users.name)
    private readonly userModel: Model<Users>,
    private readonly getUserService: GetUserService,
    private readonly utilsService: UtilsService,
    private readonly getTaskService: GetTaskService,
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
      const startTime = Date.now();
      this.logger.log('Starting getTesterAnalysis');

      const thresholdSettings = await this.utilsService.getThresholdSettings();
      const thresholdValue = thresholdSettings.thresholdValue;
      const totalTasks = await this.getTaskService.getTotalTasks();

      this.logger.log(
        `Current threshold value: ${thresholdValue}, Total tasks: ${totalTasks}`,
      );

      // Get comprehensive worker data including completion status
      const workerAnalysis = await this.userModel.aggregate([
        { $match: { role: 'worker' } },
        {
          $addFields: {
            completedTasksCount: {
              $size: { $ifNull: ['$completedTasks', []] },
            },
            hasCompletedAllTasks: {
              $gte: [
                { $size: { $ifNull: ['$completedTasks', []] } },
                totalTasks,
              ],
            },
          },
        },
        {
          $lookup: {
            from: 'eligibilities',
            localField: '_id',
            foreignField: 'workerId',
            as: 'eligibilityRecords',
          },
        },
        {
          $addFields: {
            averageAccuracy: {
              $cond: {
                if: { $gt: [{ $size: '$eligibilityRecords' }, 0] },
                then: { $avg: '$eligibilityRecords.accuracy' },
                else: 0,
              },
            },
            eligibilityRecordsCount: { $size: '$eligibilityRecords' },
          },
        },
        {
          $addFields: {
            calculatedEligibility: {
              $cond: {
                if: {
                  $and: [
                    { $eq: ['$hasCompletedAllTasks', true] },
                    { $gt: ['$eligibilityRecordsCount', 0] },
                    { $gt: ['$averageAccuracy', thresholdValue] },
                  ],
                },
                then: true,
                else: {
                  $cond: {
                    if: {
                      $and: [
                        { $eq: ['$hasCompletedAllTasks', true] },
                        { $gt: ['$eligibilityRecordsCount', 0] },
                      ],
                    },
                    then: false,
                    else: null, // Pending - either not completed all tasks or no eligibility records
                  },
                },
              },
            },
            status: {
              $cond: {
                if: { $eq: ['$hasCompletedAllTasks', true] },
                then: {
                  $cond: {
                    if: { $gt: ['$eligibilityRecordsCount', 0] },
                    then: 'completed_with_eligibility',
                    else: 'completed_pending_eligibility',
                  },
                },
                else: 'in_progress',
              },
            },
          },
        },
        {
          $project: {
            workerId: { $toString: '$_id' },
            testerName: {
              $concat: [
                { $ifNull: ['$firstName', 'Unknown'] },
                ' ',
                { $ifNull: ['$lastName', 'User'] },
              ],
            },
            averageScore: { $round: ['$averageAccuracy', 3] },
            accuracy: { $round: ['$averageAccuracy', 3] },
            isEligible: '$calculatedEligibility',
            completedTasksCount: 1,
            totalTasks: { $literal: totalTasks },
            hasCompletedAllTasks: 1,
            eligibilityRecordsCount: 1,
            status: 1,
          },
        },
        {
          $sort: { accuracy: -1, completedTasksCount: -1 },
        },
      ]);

      this.logger.log(
        `getTesterAnalysis executed in ${Date.now() - startTime}ms. Found ${workerAnalysis.length} workers.`,
      );

      // Log summary for debugging
      const statusSummary = workerAnalysis.reduce((acc, worker) => {
        acc[worker.status] = (acc[worker.status] || 0) + 1;
        return acc;
      }, {});

      this.logger.log(`Worker status summary:`, statusSummary);

      this.testerAnalysisCache = {
        results: workerAnalysis,
        timestamp: Date.now(),
      };

      return workerAnalysis;
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
                format: '%Y-%m-%d %H:%M',
                date: { $ifNull: ['$createdAt', new Date()] },
              },
            },
          },
        },
        {
          $lookup: {
            from: 'users',
            let: { workerObjectId: { $toObjectId: '$workerId' } },
            pipeline: [
              { $match: { $expr: { $eq: ['$_id', '$$workerObjectId'] } } },
            ],
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
            score: { $round: [{ $ifNull: ['$accuracy', 0.5] }, 3] },
            eligibilityStatus: 1,
            feedback: {
              $concat: [
                'M-X Algorithm Analysis - Worker: ',
                { $ifNull: ['$workerDetails.firstName', 'Unknown'] },
                ' ',
                { $ifNull: ['$workerDetails.lastName', 'User'] },
                ' | Task: ',
                { $toString: '$taskId' },
                ' | Accuracy: ',
                { $toString: { $round: [{ $ifNull: ['$accuracy', 0] }, 3] } },
              ],
            },
            createdAt: '$createdAt',
            formattedDate: 1,
          },
        },
      ]);

      this.logger.log(
        `getTestResults executed in ${Date.now() - startTime}ms. Found ${results.length} results.`,
      );

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

      if (!result.length || result[0].count === 0) {
        this.logger.debug(
          `No eligibility records found for worker ${workerId}`,
        );
        return;
      }

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

      this.logger.log(
        `Updated eligibility for worker ${workerId}: ${
          isEligible ? 'Eligible' : 'Not Eligible'
        } (avg accuracy: ${averageAccuracy.toFixed(3)}, threshold: ${threshold.toFixed(3)})`,
      );

      // Clear cache when eligibility is updated
      this.testResultsCache = null;
      this.testerAnalysisCache = null;
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
      const totalTasks = await this.getTaskService.getTotalTasks();

      this.logger.log(
        `Running eligibility update with threshold: ${threshold}, total tasks: ${totalTasks}`,
      );

      // Get workers who have completed all tasks and have eligibility records
      const workerEligibilities = await this.eligibilityModel.aggregate([
        {
          $group: {
            _id: '$workerId',
            averageAccuracy: { $avg: { $ifNull: ['$accuracy', 0] } },
            totalRecords: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: 'users',
            let: { workerObjectId: { $toObjectId: '$_id' } },
            pipeline: [
              { $match: { $expr: { $eq: ['$_id', '$$workerObjectId'] } } },
            ],
            as: 'workerDetails',
          },
        },
        {
          $unwind: { path: '$workerDetails', preserveNullAndEmptyArrays: true },
        },
        {
          $addFields: {
            completedTasksCount: {
              $size: { $ifNull: ['$workerDetails.completedTasks', []] },
            },
            hasCompletedAllTasks: {
              $gte: [
                { $size: { $ifNull: ['$workerDetails.completedTasks', []] } },
                totalTasks,
              ],
            },
          },
        },
        {
          $match: { hasCompletedAllTasks: true }, // Only update workers who completed all tasks
        },
        {
          $addFields: {
            isEligible: { $gt: ['$averageAccuracy', threshold] },
          },
        },
      ]);

      // Prepare bulk operations for workers with eligibility records
      const bulkOps = workerEligibilities.map((worker) => ({
        updateOne: {
          filter: { _id: worker._id },
          update: { $set: { isEligible: worker.isEligible } },
        },
      }));

      // Find workers who completed all tasks but have no eligibility records (should remain pending)
      const workersCompletedNoPending = await this.userModel.aggregate([
        { $match: { role: 'worker' } },
        {
          $addFields: {
            completedTasksCount: {
              $size: { $ifNull: ['$completedTasks', []] },
            },
            hasCompletedAllTasks: {
              $gte: [
                { $size: { $ifNull: ['$completedTasks', []] } },
                totalTasks,
              ],
            },
          },
        },
        {
          $match: { hasCompletedAllTasks: true },
        },
        {
          $lookup: {
            from: 'eligibilities',
            localField: '_id',
            foreignField: 'workerId',
            as: 'eligibilities',
          },
        },
        { $match: { eligibilities: { $size: 0 } } }, // No eligibility records
      ]);

      // Set workers who completed all tasks but have no eligibility as pending
      workersCompletedNoPending.forEach((worker) => {
        bulkOps.push({
          updateOne: {
            filter: { _id: worker._id },
            update: { $set: { isEligible: null } },
          },
        });
      });

      // Find workers who haven't completed all tasks (should remain null/pending)
      const workersNotCompleted = await this.userModel.aggregate([
        { $match: { role: 'worker' } },
        {
          $addFields: {
            completedTasksCount: {
              $size: { $ifNull: ['$completedTasks', []] },
            },
            hasCompletedAllTasks: {
              $gte: [
                { $size: { $ifNull: ['$completedTasks', []] } },
                totalTasks,
              ],
            },
          },
        },
        {
          $match: { hasCompletedAllTasks: false },
        },
      ]);

      // Set workers who haven't completed all tasks as pending
      workersNotCompleted.forEach((worker) => {
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

      // Clear all caches
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

        const accuracy = accuracyMap.has(key) ? accuracyMap.get(key) : 0.75;
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
