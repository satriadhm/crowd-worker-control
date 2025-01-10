import { Field, ObjectType } from '@nestjs/graphql';
import { Answer } from 'src/tasks/models/task';

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

  @Field(() => [Answer])
  answers: Answer[];
}
