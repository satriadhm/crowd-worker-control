// src/M1/m1.module.ts
import { TasksModule } from './../tasks/tasks.module';
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { M1Resolver } from './m1.resolver';
import { Task, TaskSchema } from 'src/tasks/models/task';
import { RecordedAnswer, RecordedAnswerSchema } from './models/recorded';
import { Eligibility, EligibilitySchema } from './models/eligibility';
// import { AccuracyCalculationService } from './services/accuracy.calculation.service';
import { GetRecordedAnswerService } from './services/recorded/get.recorded.service';
import { CreateEligibilityService } from './services/eligibility/create.eligibility.service';
import { CreateRecordedService } from './services/recorded/create.recorded.service';
import { GetEligibilityService } from './services/eligibility/get.eligibility.service';
import { UpdateEligibilityService } from './services/eligibility/update.eligibility.service';
import { UsersModule } from 'src/users/users.module';
import { AccuracyCalculationServiceMX } from './services/mx/mx.calculation.service';
import { CreateRecordedAnswerInput } from './dto/recorded/create.recorded.input';

@Module({
  imports: [
    forwardRef(() => TasksModule),
    forwardRef(() => UsersModule),
    MongooseModule.forFeature([
      { name: Task.name, schema: TaskSchema },
      { name: RecordedAnswer.name, schema: RecordedAnswerSchema },
      { name: Eligibility.name, schema: EligibilitySchema },
    ]),
  ],
  providers: [
    CreateRecordedAnswerInput,
    CreateRecordedService,
    CreateEligibilityService,
    GetEligibilityService,
    GetRecordedAnswerService,
    UpdateEligibilityService,
    // AccuracyCalculationService,
    AccuracyCalculationServiceMX,
    M1Resolver,
  ],
  exports: [
    CreateRecordedAnswerInput,
    CreateRecordedService,
    CreateEligibilityService,
    GetEligibilityService,
    GetRecordedAnswerService,
    UpdateEligibilityService,
    AccuracyCalculationServiceMX,
    // AccuracyCalculationService,
  ],
})
export class M1Module {}
