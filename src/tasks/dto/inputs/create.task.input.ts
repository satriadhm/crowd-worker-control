import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class AnswerInput {
  @Field({ nullable: true })
  answer: string;

  @Field({ nullable: true })
  stats: number;
}

@InputType()
export class CreateTaskInput {
  @Field()
  title: string;

  @Field({ nullable: true })
  description: string;

  @Field()
  question: string;

  @Field(() => [AnswerInput])
  answers: AnswerInput[];
}
