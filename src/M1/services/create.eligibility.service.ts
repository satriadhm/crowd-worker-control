import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Eligibility } from '../models/eligibility';
import { Model } from 'mongoose';

@Injectable()
export class CreateEligibilityService {
  constructor(
    @InjectModel(Eligibility.name)
    private readonly eligibilityModel: Model<Eligibility>,
  ) {}

  /**
   * Create a new eligibility record for a worker and task.
   */
  async createEligibility(input: CreateEligibilityInput): Promise<> {
    return await this.eligibilityModel.create({
      taskId: input.taskId,
      workerId: input.workerId,
      answer: '',
      eligible: false,
    });
  }
}
