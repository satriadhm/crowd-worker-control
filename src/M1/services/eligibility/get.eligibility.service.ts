import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Eligibility } from '../../models/eligibility';
import { GQLThrowType, ThrowGQL } from '@app/gqlerr';
import { parseToViewEligibility } from 'src/M1/models/parser';
import { EligibilityView } from 'src/M1/dto/eligibility/views/eligibility.view';

@Injectable()
export class GetEligibilityService {
  constructor(
    @InjectModel(Eligibility.name)
    private readonly eligibilityModel: Model<Eligibility>,
  ) {}

  async getEligibility(): Promise<EligibilityView[]> {
    try {
      const res = await this.eligibilityModel.find();
      return res.map((result) => parseToViewEligibility(result));
    } catch (error) {
      throw new ThrowGQL('Error getting eligibility', GQLThrowType.NOT_FOUND);
    }
  }

  async getEligibilityById(eligibilityId: string): Promise<EligibilityView> {
    try {
      const res = await this.eligibilityModel.findById(eligibilityId);
      if (!res) {
        throw new ThrowGQL('Eligibility not found', GQLThrowType.NOT_FOUND);
      }
      return parseToViewEligibility(res);
    } catch (error) {
      throw new ThrowGQL('Error getting eligibility', GQLThrowType.NOT_FOUND);
    }
  }

  async getEligibilityWorkerId(workerId: string): Promise<EligibilityView[]> {
    try {
      const results = await this.eligibilityModel.find({ workerId });
      return results.map((result) => parseToViewEligibility(result));
    } catch (error) {
      throw new ThrowGQL('Error getting eligibility', GQLThrowType.NOT_FOUND);
    }
  }

  async getElibilityAndUpdate(
    eligibilityId: string,
    update: any,
  ): Promise<EligibilityView> {
    try {
      const res = await this.eligibilityModel.findByIdAndUpdate(
        eligibilityId,
        update,
        { new: true },
      );
      if (!res) {
        throw new ThrowGQL('Eligibility not found', GQLThrowType.NOT_FOUND);
      }
      return parseToViewEligibility(res);
    } catch (error) {
      console.log('Error', error);
      throw new ThrowGQL(`Error ${error}`, GQLThrowType.NOT_FOUND);
    }
  }
}
