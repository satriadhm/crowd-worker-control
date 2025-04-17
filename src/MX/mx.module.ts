import { TasksModule } from '../tasks/tasks.module';
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { M1Resolver } from './mx.resolver';
import { Task, TaskSchema } from 'src/tasks/models/task';
import { RecordedAnswer, RecordedAnswerSchema } from './models/recorded';
import { Eligibility, EligibilitySchema } from './models/eligibility';
import { GetRecordedAnswerService } from './services/recorded/get.recorded.service';
import { CreateEligibilityService } from './services/eligibility/create.eligibility.service';
import { CreateRecordedService } from './services/recorded/create.recorded.service';
import { GetEligibilityService } from './services/eligibility/get.eligibility.service';
import { UpdateEligibilityService } from './services/eligibility/update.eligibility.service';
import { UsersModule } from 'src/users/users.module';
import { Users, UsersSchema } from 'src/users/models/user';
import { CreateRecordedAnswerInput } from './dto/recorded/create.recorded.input';
import { AccuracyCalculationServiceMX } from './services/mx/mx.calculation.service';
import { WorkerAnalysisService } from './services/worker-analysis/worker-analysis.service';
import { DashboardService } from './services/dashboard/dashboard.service';
import { MissingWorkerIdCronService } from './services/worker-analysis/data-analysis.service';
import { UtilsService } from './services/utils/utils.service';

@Module({
  imports: [
    forwardRef(() => TasksModule),
    forwardRef(() => UsersModule),
    MongooseModule.forFeature([
      { name: Task.name, schema: TaskSchema },
      { name: RecordedAnswer.name, schema: RecordedAnswerSchema },
      { name: Eligibility.name, schema: EligibilitySchema },
      { name: Users.name, schema: UsersSchema }, // Added Users model
    ]),
  ],
  providers: [
    CreateRecordedAnswerInput,
    MissingWorkerIdCronService,
    CreateRecordedService,
    CreateEligibilityService,
    GetEligibilityService,
    GetRecordedAnswerService,
    UpdateEligibilityService,
    AccuracyCalculationServiceMX,
    WorkerAnalysisService,
    UtilsService,
    DashboardService,
    M1Resolver,
  ],
  exports: [
    CreateRecordedAnswerInput,
    CreateRecordedService,
    CreateEligibilityService,
    GetEligibilityService,
    GetRecordedAnswerService,
    UpdateEligibilityService,
    DashboardService,
    UtilsService,
    AccuracyCalculationServiceMX,
    WorkerAnalysisService,
  ],
})
export class M1Module {}
