import { Module } from '@nestjs/common';
import { M1Service } from './services/m1.service';
import { M1Resolver } from './m1.resolver';
import { TasksModule } from 'src/tasks/tasks.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Eligibility, EligibilitySchema } from './models/eligibility';
import { RecordedAnswer, RecordedAnswerSchema } from './models/recorded';

@Module({
  imports: [
    TasksModule,
    MongooseModule.forFeature([
      { name: RecordedAnswer.name, schema: RecordedAnswerSchema },
      { name: Eligibility.name, schema: EligibilitySchema },
    ]),
  ],
  providers: [M1Resolver, M1Service],
})
export class M1Module {}
