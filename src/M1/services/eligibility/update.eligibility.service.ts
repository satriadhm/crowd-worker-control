// src/M1/services/eligibility-update.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Eligibility } from '../../models/eligibility';
import { GetRecordedAnswerService } from '../recorded/get.recorded.service';

@Injectable()
export class UpdateEligibilityService {
  constructor(
    @InjectModel(Eligibility.name)
    private readonly eligibilityModel: Model<Eligibility>,
    private readonly getRecordedAnswerService: GetRecordedAnswerService,
  ) {}
}
