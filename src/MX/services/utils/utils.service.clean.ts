import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GQLThrowType, ThrowGQL } from '@app/gqlerr';
import { ThresholdType, Utils } from 'src/MX/models/utils';
import { Eligibility } from 'src/MX/models/eligibility';

@Injectable()
export class UtilsService {
  private readonly logger = new Logger(UtilsService.name);

  constructor(
    @InjectModel(Utils.name)
    private readonly utilsModel: Model<Utils>,
    @InjectModel(Eligibility.name)
    private readonly eligibilityModel: Model<Eligibility>,
  ) {
    this.initializeUtils();
  }

  private async initializeUtils() {
    try {
      const count = await this.utilsModel.countDocuments().exec();
      if (count === 0) {
        await this.utilsModel.create({
          thresholdType: ThresholdType.MEDIAN,
          thresholdValue: 0.7,
          lastUpdated: new Date(),
        });
        this.logger.log('Created default utils configuration');
      }
    } catch (error) {
      this.logger.error('Failed to initialize utils configuration', error);
    }
  }

  async getThresholdSettings(): Promise<Utils> {
    try {
      let utils = await this.utilsModel.findOne().exec();

      if (!utils) {
        utils = await this.utilsModel.create({
          thresholdType: ThresholdType.MEDIAN,
          thresholdValue: 0.7,
          lastUpdated: new Date(),
        });
      }

      return utils;
    } catch (error) {
      this.logger.error('Failed to get threshold settings', error);
      throw new ThrowGQL(
        'Failed to get threshold settings',
        GQLThrowType.UNEXPECTED,
      );
    }
  }

  async updateThresholdSettings(
    thresholdType: ThresholdType,
    thresholdValue?: number,
  ): Promise<Utils> {
    try {
      if (thresholdType === ThresholdType.CUSTOM) {
        if (thresholdValue === undefined) {
          throw new ThrowGQL(
            'Threshold value must be provided when type is custom',
            GQLThrowType.BAD_REQUEST,
          );
        }

        if (thresholdValue < 0 || thresholdValue > 1) {
          throw new ThrowGQL(
            'Threshold value must be between 0 and 1',
            GQLThrowType.BAD_REQUEST,
          );
        }
      }

      const updateData: Partial<Utils> = {
        thresholdType,
        lastUpdated: new Date(),
      };

      if (
        thresholdType === ThresholdType.MEDIAN ||
        thresholdType === ThresholdType.MEAN
      ) {
        const allAccuracies = await this.getAllWorkerAccuracies();
        const calculatedThreshold =
          thresholdType === ThresholdType.MEDIAN
            ? this.calculateMedian(allAccuracies)
            : this.calculateMean(allAccuracies);

        updateData.thresholdValue = calculatedThreshold;
      } else if (thresholdValue !== undefined) {
        updateData.thresholdValue = thresholdValue;
      }

      const utils = await this.utilsModel.findOneAndUpdate(
        {},
        { $set: updateData },
        { upsert: true, new: true },
      );

      this.logger.log(
        `Updated threshold settings: type=${thresholdType}, value=${utils.thresholdValue}`,
      );

      return utils;
    } catch (error) {
      if (error instanceof ThrowGQL) {
        throw error;
      }

      this.logger.error('Failed to update threshold settings', error);
      throw new ThrowGQL(
        'Failed to update threshold settings',
        GQLThrowType.UNEXPECTED,
      );
    }
  }

  private async getAllWorkerAccuracies(): Promise<number[]> {
    try {
      const eligibilityRecords = await this.eligibilityModel.find().exec();

      if (eligibilityRecords.length === 0) {
        return [0.7];
      }

      const workerAccuracies = new Map<string, number[]>();

      for (const record of eligibilityRecords) {
        const workerId = record.workerId.toString();
        const accuracy = record.accuracy || 0;

        if (!workerAccuracies.has(workerId)) {
          workerAccuracies.set(workerId, []);
        }

        workerAccuracies.get(workerId)?.push(accuracy);
      }

      const averageAccuracies: number[] = [];

      for (const accuracies of workerAccuracies.values()) {
        if (accuracies.length > 0) {
          const avgAccuracy =
            accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
          averageAccuracies.push(avgAccuracy);
        }
      }

      return averageAccuracies.length > 0 ? averageAccuracies : [0.7];
    } catch (error) {
      this.logger.error('Error getting worker accuracies', error);
      return [0.7]; // Default if error
    }
  }

  async calculateThreshold(accuracyValues: number[]): Promise<number> {
    try {
      if (!accuracyValues || accuracyValues.length === 0) {
        return 0.7;
      }

      const settings = await this.getThresholdSettings();

      switch (settings.thresholdType) {
        case ThresholdType.MEDIAN: {
          return this.calculateMedian(accuracyValues);
        }

        case ThresholdType.MEAN: {
          return this.calculateMean(accuracyValues);
        }

        case ThresholdType.CUSTOM: {
          return settings.thresholdValue;
        }

        default:
          return this.calculateMedian(accuracyValues);
      }
    } catch (error) {
      this.logger.error('Failed to calculate threshold', error);
      return 0.7;
    }
  }

  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0.7;

    const sorted = [...values].sort((a, b) => a - b);

    const middle = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 1) {
      return sorted[middle];
    }

    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  private calculateMean(values: number[]): number {
    if (values.length === 0) return 0.7;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  async updateGlobalThreshold(newThreshold: number): Promise<Utils> {
    try {
      const utils = await this.utilsModel.findOneAndUpdate(
        {},
        {
          $set: {
            thresholdValue: newThreshold,
            lastUpdated: new Date(),
          },
        },
        { upsert: true, new: true },
      );

      this.logger.log(
        `Global threshold updated to: ${newThreshold.toFixed(3)}`,
      );
      return utils;
    } catch (error) {
      this.logger.error('Failed to update global threshold', error);
      throw new ThrowGQL(
        'Failed to update global threshold',
        GQLThrowType.UNEXPECTED,
      );
    }
  }

  calculateWeightedThreshold(eligibilityRecords: any[]): number {
    if (!eligibilityRecords || eligibilityRecords.length === 0) {
      return 0.7;
    }

    // Group by worker to get average accuracy per worker
    const workerAccuracies = new Map<string, number[]>();

    for (const record of eligibilityRecords) {
      const workerId = record.workerId.toString();
      const accuracy = record.accuracy || 0;

      if (!workerAccuracies.has(workerId)) {
        workerAccuracies.set(workerId, []);
      }

      workerAccuracies.get(workerId)?.push(accuracy);
    }

    // Calculate average accuracy per worker
    const workerAverages: number[] = [];

    for (const accuracies of workerAccuracies.values()) {
      if (accuracies.length > 0) {
        const avgAccuracy =
          accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
        workerAverages.push(avgAccuracy);
      }
    }

    // Calculate threshold using median for robustness
    return this.calculateMedian(workerAverages);
  }

  /**
   * ISOLATED BATCH PROCESSING + PERIODIC GLOBAL RECALIBRATION
   * Core functionality for production systems
   */

  /**
   * Process batch independently - core function for M-X calculation service
   */
  async processBatchIsolated(
    workerSubmissions: Array<{
      workerId: string;
      taskId: string;
      accuracy: number;
    }>,
  ): Promise<{
    processedCount: number;
    threshold: number;
    batchId: string;
    timestamp: Date;
  }> {
    try {
      const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = new Date();

      this.logger.log(
        `Processing isolated batch: ${batchId} with ${workerSubmissions.length} submissions`,
      );

      // Get current threshold for this batch
      const currentThreshold = await this.getCurrentThreshold();

      let processedCount = 0;

      // Process each submission independently
      for (const submission of workerSubmissions) {
        try {
          // Create eligibility record only if it doesn't exist
          const existingRecord = await this.eligibilityModel.findOne({
            workerId: submission.workerId,
            taskId: submission.taskId,
          });

          if (!existingRecord) {
            await this.eligibilityModel.create({
              workerId: submission.workerId,
              taskId: submission.taskId,
              accuracy: submission.accuracy,
            });
            processedCount++;

            this.logger.debug(
              `Created eligibility record for worker ${submission.workerId} with accuracy ${submission.accuracy.toFixed(3)}`,
            );
          }
        } catch (error) {
          this.logger.error(
            `Error processing submission for worker ${submission.workerId}:`,
            error,
          );
        }
      }

      this.logger.log(
        `Batch ${batchId} processed: ${processedCount}/${workerSubmissions.length} new records created`,
      );

      return {
        processedCount,
        threshold: currentThreshold,
        batchId,
        timestamp,
      };
    } catch (error) {
      this.logger.error('Error processing isolated batch', error);
      throw new ThrowGQL(
        'Failed to process isolated batch',
        GQLThrowType.UNEXPECTED,
      );
    }
  }

  /**
   * Periodic global recalibration - updates threshold only
   */
  async performGlobalRecalibration(): Promise<{
    oldThreshold: number;
    newThreshold: number;
    affectedWorkers: number;
    recalibrationReason: string;
    timestamp: Date;
  }> {
    try {
      this.logger.log('Starting periodic global recalibration...');

      const oldSettings = await this.getThresholdSettings();
      const oldThreshold = oldSettings.thresholdValue;

      // Get all eligibility records for recalibration
      const allRecords = await this.eligibilityModel.find().exec();

      if (allRecords.length === 0) {
        this.logger.warn('No eligibility records found for recalibration');
        return {
          oldThreshold,
          newThreshold: oldThreshold,
          affectedWorkers: 0,
          recalibrationReason: 'No data available',
          timestamp: new Date(),
        };
      }

      // Calculate new global threshold based on all data
      const newThreshold = this.calculateWeightedThreshold(allRecords);

      // Update threshold settings
      await this.updateGlobalThreshold(newThreshold);

      // Count affected workers (for logging purposes)
      const uniqueWorkers = new Set(
        allRecords.map((r) => r.workerId.toString()),
      ).size;

      const recalibrationReason = `Periodic recalibration based on ${allRecords.length} eligibility records`;

      this.logger.log(
        `Global recalibration completed: ${oldThreshold.toFixed(3)} -> ${newThreshold.toFixed(3)}, ${uniqueWorkers} workers in system`,
      );

      return {
        oldThreshold,
        newThreshold,
        affectedWorkers: uniqueWorkers,
        recalibrationReason,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Error performing global recalibration', error);
      throw new ThrowGQL(
        'Failed to perform global recalibration',
        GQLThrowType.UNEXPECTED,
      );
    }
  }

  /**
   * Check if global recalibration is needed
   */
  async shouldPerformGlobalRecalibration(): Promise<{
    needed: boolean;
    reason: string;
    timeSinceLastUpdate: number;
    newRecordsCount: number;
  }> {
    try {
      const settings = await this.getThresholdSettings();
      const lastUpdated = settings.lastUpdated || new Date(0);
      const currentTime = new Date();
      const timeSinceLastUpdate = currentTime.getTime() - lastUpdated.getTime();

      // Configurable thresholds
      const RECALIBRATION_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
      const NEW_RECORDS_THRESHOLD = 50; // Recalibrate after 50 new records

      // Check time-based recalibration
      if (timeSinceLastUpdate > RECALIBRATION_INTERVAL) {
        return {
          needed: true,
          reason: `24 hours have passed since last recalibration (${Math.floor(timeSinceLastUpdate / (60 * 60 * 1000))} hours ago)`,
          timeSinceLastUpdate,
          newRecordsCount: 0,
        };
      }

      // Check records-based recalibration
      const newRecordsCount = await this.eligibilityModel.countDocuments({
        createdAt: { $gte: lastUpdated },
      });

      if (newRecordsCount >= NEW_RECORDS_THRESHOLD) {
        return {
          needed: true,
          reason: `${newRecordsCount} new eligibility records since last recalibration`,
          timeSinceLastUpdate,
          newRecordsCount,
        };
      }

      return {
        needed: false,
        reason: 'Recalibration criteria not met',
        timeSinceLastUpdate,
        newRecordsCount,
      };
    } catch (error) {
      this.logger.error('Error checking recalibration status', error);
      return {
        needed: false,
        reason: 'Error checking recalibration status',
        timeSinceLastUpdate: 0,
        newRecordsCount: 0,
      };
    }
  }

  /**
   * Get current threshold value for batch processing
   */
  private async getCurrentThreshold(): Promise<number> {
    try {
      const settings = await this.getThresholdSettings();
      return settings.thresholdValue;
    } catch (error) {
      this.logger.error('Error getting current threshold', error);
      return 0.7; // Default fallback
    }
  }
}
