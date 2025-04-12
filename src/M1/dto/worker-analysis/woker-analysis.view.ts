import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class AlgorithmPerformanceData {
  @Field()
  month: string;

  @Field()
  accuracyRate: number;

  @Field()
  responseTime: number;
}

@ObjectType()
export class TesterAnalysisView {
  @Field()
  workerId: string;

  @Field()
  testerName: string;

  @Field()
  averageScore: number;

  @Field()
  accuracy: number;
}

@ObjectType()
export class TestResultView {
  @Field()
  id: string;

  @Field()
  workerId: string;

  @Field()
  testId: string;

  @Field()
  score: number;

  @Field({ nullable: true })
  feedback: string;

  @Field()
  createdAt: Date;
}
