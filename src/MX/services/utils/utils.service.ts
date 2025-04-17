import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GQLThrowType, ThrowGQL } from '@app/gqlerr';
import { ThresholdType, Utils } from 'src/MX/models/utils';

@Injectable()
export class UtilsService {
  private readonly logger = new Logger(UtilsService.name);

  constructor(
    @InjectModel(Utils.name)
    private readonly utilsModel: Model<Utils>,
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

      // Find the first utils document or create one if it doesn't exist
      const updateData: Partial<Utils> = {
        thresholdType,
        lastUpdated: new Date(),
      };

      // Add threshold value if provided
      if (thresholdValue !== undefined) {
        updateData.thresholdValue = thresholdValue;
      }

      // Update the document
      const utils = await this.utilsModel.findOneAndUpdate(
        {},
        { $set: updateData },
        { upsert: true, new: true },
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

  // Method to calculate threshold based on current settings
  // This will be used by the worker eligibility service
  async calculateThreshold(accuracyValues: number[]): Promise<number> {
    try {
      if (!accuracyValues || accuracyValues.length === 0) {
        return 0.7; // Default if no values provided
      }

      const settings = await this.getThresholdSettings();

      switch (settings.thresholdType) {
        case ThresholdType.MEDIAN: {
          // Sort values and find the median
          const sorted = [...accuracyValues].sort((a, b) => a - b);
          const middle = Math.floor(sorted.length / 2);

          // If odd length, return the middle value, otherwise average the two middle values
          const median =
            sorted.length % 2 === 1
              ? sorted[middle]
              : (sorted[middle - 1] + sorted[middle]) / 2;

          return median;
        }

        case ThresholdType.MEAN: {
          // Calculate the mean (average)
          const sum = accuracyValues.reduce((acc, val) => acc + val, 0);
          return sum / accuracyValues.length;
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
    if (values.length === 0) return 0;

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
}
