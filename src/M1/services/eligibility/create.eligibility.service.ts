import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Eligibility, EligibilityDocument } from '../../models/eligibility';
import { Model } from 'mongoose';
import { CreateEligibilityInput } from '../../dto/eligibility/inputs/create.eligibility.input';

@Injectable()
export class CreateEligibilityService {
  constructor(
    @InjectModel(Eligibility.name)
    private readonly eligibilityModel: Model<EligibilityDocument>,
  ) {}

  async createEligibility(input: CreateEligibilityInput): Promise<Eligibility> {
    return await this.eligibilityModel.create({
      taskIds: [input.taskId],
      workerId: input.workerId,
      answers: [],
      eligible: false,
    });
  }
}
