import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class TestResultDto {
  @Field()
  id: string;

  @Field()
  workerId: string;

  @Field()
  testId: string;

  @Field()
  score: number;

  @Field({ nullable: true })
  feedback?: string;

  @Field()
  createdAt: Date;
}
