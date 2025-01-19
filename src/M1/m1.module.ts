import { Module } from '@nestjs/common';
import { M1Service } from './services/m1.service';
import { M1Resolver } from './m1.resolver';
import { TasksModule } from 'src/tasks/tasks.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Eligibility, EligibilitysSchema } from './models/eligibility';

@Module({
  imports: [
    TasksModule,
    MongooseModule.forFeature([
      { name: Eligibility.name, schema: EligibilitysSchema },
    ]),
  ],
  providers: [M1Resolver, M1Service],
})
export class M1Module {}
