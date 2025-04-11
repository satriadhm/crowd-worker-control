import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateRecordedAnswerInput {
  @Field()
  taskId: string;

  @Field()
  answer: string;

  @Field()
  answerId: number;
}
