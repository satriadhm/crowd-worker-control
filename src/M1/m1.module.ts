// src/M1/m1.module.ts
import { TasksModule } from './../tasks/tasks.module';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { M1Resolver } from './m1.resolver';
import { Task, TaskSchema } from 'src/tasks/models/task';
import { RecordedAnswer, RecordedAnswerSchema } from './models/recorded';
import { Eligibility, EligibilitySchema } from './models/eligibility';
import { AccuracyCalculationService } from './services/accuracy.calculation.service';
import { TaskAssignmentService } from './services/task.assignment.service';
import { EligibilityUpdateService } from './services/update.eligibility.service';

@Module({
  imports: [
    TasksModule,
    MongooseModule.forFeature([
      { name: Task.name, schema: TaskSchema },
      { name: RecordedAnswer.name, schema: RecordedAnswerSchema },
      { name: Eligibility.name, schema: EligibilitySchema },
    ]),
  ],
  providers: [
    TaskAssignmentService,
    AccuracyCalculationService,
    EligibilityUpdateService,
    M1Resolver,
  ],
})
export class M1Module {}
