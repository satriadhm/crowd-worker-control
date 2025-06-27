import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Eligibility, EligibilityDocument } from '../../models/eligibility';
import { Model } from 'mongoose';
import { CreateEligibilityInput } from '../../dto/eligibility/inputs/create.eligibility.input';
import { EligibilityView } from '../../dto/eligibility/views/eligibility.view';
import { parseToViewEligibility } from '../../models/parser';
import { Cron } from '@nestjs/schedule';
import { UtilsService } from '../utils/utils.service';

@Injectable()
export class CreateEligibilityService {
  private readonly logger = new Logger(CreateEligibilityService.name);

  constructor(
    @InjectModel(Eligibility.name)
    private readonly eligibilityModel: Model<EligibilityDocument>,
    private readonly utilsService: UtilsService,
  ) {}

  async createEligibility(input: CreateEligibilityInput): Promise<Eligibility> {
    const { taskId, workerId, accuracy } = input;

    const existingEligibility = await this.eligibilityModel.findOne({
      taskId,
      workerId,
    });

    if (existingEligibility) {
      this.logger.log(
        'Eligibility remain unchanged for workerId: ' +
          workerId +
          ' and taskId: ' +
          taskId,
      );
      return existingEligibility;
    }

    const newEligibility = await this.eligibilityModel.create({
      taskId,
      workerId,
      accuracy,
    });

    return newEligibility;
  }

  async getEligibilityByTaskId(taskId: string): Promise<EligibilityView[]> {
    try {
      const eligibilityRecords = await this.eligibilityModel.find({ taskId });
      return eligibilityRecords.map((record) => parseToViewEligibility(record));
    } catch (error) {
      console.error(
        `Error fetching eligibility records for task ${taskId}:`,
        error,
      );
      return [];
    }
  }

  // Periodic global recalibration using UtilsService
  @Cron('0 2 * * *') // Daily at 2 AM
  async performPeriodicRecalibration(): Promise<void> {
    try {
      // Check if recalibration is needed
      const shouldRecalibrate =
        await this.utilsService.shouldPerformGlobalRecalibration();

      if (shouldRecalibrate.needed) {
        this.logger.log(
          `Starting scheduled recalibration: ${shouldRecalibrate.reason}`,
        );

        // Perform global recalibration
        const result = await this.utilsService.performGlobalRecalibration();

        this.logger.log(
          `Scheduled recalibration completed: ${result.oldThreshold.toFixed(3)} -> ${result.newThreshold.toFixed(3)}, ${result.affectedWorkers} workers affected`,
        );
      } else {
        this.logger.debug(
          `Recalibration not needed: ${shouldRecalibrate.reason}`,
        );
      }
    } catch (error) {
      this.logger.error('Error during periodic recalibration', error);
    }
  }
}
