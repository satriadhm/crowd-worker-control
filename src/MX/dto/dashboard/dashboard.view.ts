// src/MX/dto/dashboard/dashboard.view.ts
import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class IterationMetric {
  @Field()
  iteration: string;

  @Field(() => Int)
  workers: number;

  @Field(() => Int)
  tasks: number;
}

@ObjectType()
export class StatusDistribution {
  @Field()
  name: string;

  @Field(() => Int)
  value: number;
}

@ObjectType()
export class AccuracyDistribution {
  @Field()
  name: string;

  @Field(() => Int)
  value: number;
}

@ObjectType()
export class DashboardSummary {
  @Field(() => [IterationMetric])
  iterationMetrics: IterationMetric[];

  @Field(() => [StatusDistribution])
  workerEligibility: StatusDistribution[];

  @Field(() => [StatusDistribution])
  taskValidation: StatusDistribution[];

  @Field(() => [AccuracyDistribution])
  accuracyDistribution: AccuracyDistribution[];
}
