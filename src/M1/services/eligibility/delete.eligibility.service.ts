import { Injectable } from '@nestjs/common';
import { Eligibility } from '../../models/eligibility';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ThrowGQL, GQLThrowType } from '@app/gqlerr';
import { EligibilityView } from 'src/M1/dto/eligibility/views/eligibility.view';
import { parseToViewEligibility } from 'src/M1/models/parser';

@Injectable()
export class DeleteEligibilityService {
  constructor(
    @InjectModel(Eligibility.name)
    private readonly eligibilityModel: Model<Eligibility>,
  ) {}

  async deleteEligibilityById(eligibilityId: string): Promise<EligibilityView> {
    try {
      const res = await this.eligibilityModel.findByIdAndDelete(eligibilityId);
      if (!res) {
        throw new ThrowGQL('Eligibility not found', GQLThrowType.NOT_FOUND);
      }
      return parseToViewEligibility(res);
    } catch (error) {
      throw new ThrowGQL('Error deleting eligibility', GQLThrowType.NOT_FOUND);
    }
  }
}
