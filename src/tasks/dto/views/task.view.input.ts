import { Field, ObjectType } from '@nestjs/graphql';
import { Answer } from 'src/tasks/models/task';

@ObjectType()
export class TaskView {
  @Field()
  id: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  description: string;

  @Field()
  question: string;

  @Field()
  nAnswers: number;

  @Field()
  isValidQuestion: boolean;

  @Field(() => [Answer])
  answers: Answer[];
}
