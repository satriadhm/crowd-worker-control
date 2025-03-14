// src/M1/m1.module.ts
import { TasksModule } from './../tasks/tasks.module';
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { M1Resolver } from './m1.resolver';
import { Task, TaskSchema } from 'src/tasks/models/task';
import { RecordedAnswer, RecordedAnswerSchema } from './models/recorded';
import { Eligibility, EligibilitySchema } from './models/eligibility';
import { AccuracyCalculationService } from './services/accuracy.calculation.service';
import { EligibilityUpdateService } from './services/eligibility/update.eligibility.service';
import { GetRecordedAnswerService } from './services/recorded/get.recorded.service';
import { CreateEligibilityService } from './services/eligibility/create.eligibility.service';
import { CreateRecordedService } from './services/recorded/create.recorded.service';
import { GetElibilityService } from './services/eligibility/get.eligibility.service';

@Module({
  imports: [
    forwardRef(() => TasksModule),
    MongooseModule.forFeature([
      { name: Task.name, schema: TaskSchema },
      { name: RecordedAnswer.name, schema: RecordedAnswerSchema },
      { name: Eligibility.name, schema: EligibilitySchema },
    ]),
  ],
  providers: [
    CreateRecordedService,
    CreateEligibilityService,
    GetElibilityService,
    GetRecordedAnswerService,
    AccuracyCalculationService,
    EligibilityUpdateService,
    M1Resolver,
  ],
  exports: [
    CreateRecordedService,
    CreateEligibilityService,
    GetElibilityService,
    GetRecordedAnswerService,
    AccuracyCalculationService,
    EligibilityUpdateService,
  ],
})
export class M1Module {}
