import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class AnswerInput {
  @Field({ nullable: true })
  answer: string;

  @Field({ nullable: true })
  stats: number;
}

@InputType()
export class GherkinsQuestionInput {
  @Field()
  scenario: string;

  @Field()
  given: string;

  @Field()
  when: string;

  @Field()
  then: string;
}

@InputType()
export class CreateTaskInput {
  @Field()
  title: string;

  @Field({ nullable: true })
  description: string;

  @Field(() => GherkinsQuestionInput)
  question: GherkinsQuestionInput;

  @Field(() => [AnswerInput])
  answers: AnswerInput[];
}
