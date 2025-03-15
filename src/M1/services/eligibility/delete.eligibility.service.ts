import { Injectable } from '@nestjs/common';
import { Eligibility } from '../../models/eligibility';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ThrowGQL, GQLThrowType } from '@app/gqlerr';

@Injectable()
export class DeleteEligibilityService {
  constructor(
    @InjectModel(Eligibility.name)
    private readonly eligibilityModel: Model<Eligibility>,
  ) {}

  async deleteEligibilityById(eligibilityId: string): Promise<Eligibility> {
    try {
      const res = await this.eligibilityModel.findByIdAndDelete(eligibilityId);
      return res;
    } catch (error) {
      throw new ThrowGQL('Error deleting eligibility', GQLThrowType.NOT_FOUND);
    }
  }
}
