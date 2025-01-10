import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class TaskView {
  @Field()
  title: string;

  @Field({ nullable: true })
  description: string;

  @Field()
  question: string;

  @Field()
  nAnswers: number;

  @Field(() => [String])
  answers: string[];
}
