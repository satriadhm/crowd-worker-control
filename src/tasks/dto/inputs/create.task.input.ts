import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateTaskInput {
  @Field()
  title: string;

  @Field({ nullable: true })
  description: string;

  @Field()
  question: string;

  @Field(() => [String])
  answers: string[];
}
