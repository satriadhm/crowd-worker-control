import { Module } from '@nestjs/common';
import { EvaluationService } from './evaluation.service';
import { EvaluationResolver } from './evaluation.resolver';
import { MongooseModule } from '@nestjs/mongoose';
import { TestResult, TestResultSchema } from './entities/test-result.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TestResult.name, schema: TestResultSchema },
    ]),
  ],
  providers: [EvaluationService,EvaluationResolver],
  exports: [EvaluationService],
})
export class EvaluationModule {}
