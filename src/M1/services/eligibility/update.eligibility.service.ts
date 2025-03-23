// src/M1/services/eligibility-update.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Eligibility } from '../../models/eligibility';

@Injectable()
export class UpdateEligibilityService {
  constructor(
    @InjectModel(Eligibility.name)
    private readonly eligibilityModel: Model<Eligibility>,
  ) {}

  async updateEligibility(
    taskId: string,
    accuracies: Record<string, number>,
    threshold = 0.7,
  ): Promise<void> {
    const updates = Object.entries(accuracies).map(([workerId, accuracy]) => ({
      updateOne: {
        filter: { taskId, workerId },
        update: { $set: { accuracy, eligible: accuracy >= threshold } },
      },
    }));

    if (updates.length > 0) {
      await this.eligibilityModel.bulkWrite(updates);
    }
  }
}
