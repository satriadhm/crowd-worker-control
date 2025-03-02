import { Field, ObjectType, Float } from '@nestjs/graphql';

@ObjectType()
export class TesterAnalysisDto {
  @Field()
  workerId: string;

  @Field()
  testerName: string;

  @Field(() => Float)
  averageScore: number;

  @Field(() => Float)
  accuracy: number;
}
