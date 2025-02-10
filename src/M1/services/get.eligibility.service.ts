import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Eligibility } from '../models/eligibility';
import { GQLThrowType, ThrowGQL } from '@app/gqlerr';

@Injectable()
export class GetElibilityService {
  constructor(
    @InjectModel(Eligibility.name)
    private readonly eligibilityModel: Model<Eligibility>,
  ) {}

  async getEligibility(): Promise<Eligibility[]> {
    try {
      const res = await this.eligibilityModel.find();
      return res;
    } catch (error) {
      throw new ThrowGQL('Error getting eligibility', GQLThrowType.NOT_FOUND);
    }
  }

  async getEligibilityById(eligibilityId: string): Promise<Eligibility> {
    try {
      const res = await this.eligibilityModel.findById(eligibilityId);
      return res;
    } catch (error) {
      throw new ThrowGQL('Error getting eligibility', GQLThrowType.NOT_FOUND);
    }
  }

  async findOne(query: any): Promise<Eligibility> {
    try {
      const res = await this.eligibilityModel.findOne(query);
      return res;
    } catch (error) {
      throw new ThrowGQL('Error finding eligibility', GQLThrowType.NOT_FOUND);
    }
  }

  async findOneAndUpdate(query: any, update: any, options: any) {
    try {
      await this.eligibilityModel.findOneAndUpdate(query, update, options);
    } catch (error) {
      throw new ThrowGQL('Error updating eligibility', GQLThrowType.NOT_FOUND);
    }
  }

  async getElibilityAndUpdate(
    eligibilityId: string,
    update: any,
  ): Promise<Eligibility> {
    try {
      const res = await this.eligibilityModel.findByIdAndUpdate(
        eligibilityId,
        update,
        { new: true },
      );
      return res;
    } catch (error) {
      throw new ThrowGQL('Error updating eligibility', GQLThrowType.NOT_FOUND);
    }
  }
}
