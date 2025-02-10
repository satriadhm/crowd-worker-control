import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Eligibility } from '../models/eligibility';

@Injectable()
export class GetElibilityService {
  constructor(
    @InjectModel(Eligibility.name)
    private readonly eligibilityModel: Model<Eligibility>,
  ) {}

  async getEligibility(): Promise<Eligibility[]> {
    return this.eligibilityModel.find();
  }

  async getEligibilityById(eligibilityId: string): Promise<Eligibility> {
    return this.eligibilityModel.findById(eligibilityId);
  }
}
