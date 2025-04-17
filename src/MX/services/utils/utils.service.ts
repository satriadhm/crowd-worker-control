// src/MX/services/utils/utils.service.ts
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
    // Ensure we have at least one utils document
    this.initializeUtils();
  }

  private async initializeUtils() {
    try {
      const count = await this.utilsModel.countDocuments().exec();
      if (count === 0) {
        // Create default configuration if none exists
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
      // Get first document (should be the only one)
      let utils = await this.utilsModel.findOne().exec();

      // If no document exists, create one with defaults
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
      // Validate custom threshold value
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

      // Prepare update data
      const updateData: Partial<Utils> = {
        thresholdType,
        lastUpdated: new Date(),
      };

      // If threshold type is MEDIAN or MEAN, calculate it
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
        // For CUSTOM type, use the provided value
        updateData.thresholdValue = thresholdValue;
      }

      // Update the document
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
      // If it's already a ThrowGQL, rethrow it
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

  // Get all worker accuracies for threshold calculation
  private async getAllWorkerAccuracies(): Promise<number[]> {
    try {
      // Get all eligibility records
      const eligibilityRecords = await this.eligibilityModel.find().exec();

      if (eligibilityRecords.length === 0) {
        return [0.7]; // Default value if no records
      }

      // Group by workerId and calculate average accuracy per worker
      const workerAccuracies = new Map<string, number[]>();

      for (const record of eligibilityRecords) {
        const workerId = record.workerId.toString();
        const accuracy = record.accuracy || 0;

        if (!workerAccuracies.has(workerId)) {
          workerAccuracies.set(workerId, []);
        }

        workerAccuracies.get(workerId)?.push(accuracy);
      }

      // Calculate average accuracy for each worker
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
        return 0.7; // Default if no values provided
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
          // Return the custom value
          return settings.thresholdValue;
        }

        default:
          // Fallback to median if threshold type is not recognized
          return this.calculateMedian(accuracyValues);
      }
    } catch (error) {
      this.logger.error('Failed to calculate threshold', error);
      // Default to 0.7 on error
      return 0.7;
    }
  }

  // Helper method to calculate median
  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0.7;

    // Sort the array
    const sorted = [...values].sort((a, b) => a - b);

    // Find the middle
    const middle = Math.floor(sorted.length / 2);

    // If odd length, return the middle value
    if (sorted.length % 2 === 1) {
      return sorted[middle];
    }

    // If even length, return the average of the two middle values
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  // Helper method to calculate mean
  private calculateMean(values: number[]): number {
    if (values.length === 0) return 0.7;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }
}
