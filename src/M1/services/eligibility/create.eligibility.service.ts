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

  async upSertEligibility(input: CreateEligibilityInput): Promise<Eligibility> {
    const { taskId, workerId, accuracy, eligible } = input;
    const eligibility = await this.eligibilityModel.findOneAndUpdate(
      { taskId, workerId },
      { taskId, workerId, accuracy, eligible },
      { upsert: true, new: true },
    );
    return eligibility;
  }
}
