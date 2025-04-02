import { Field, ObjectType } from '@nestjs/graphql';
import { Answer, GherkinsQuestion } from 'src/tasks/models/task';

@ObjectType()
export class TaskView {
  @Field()
  id: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  description: string;

  @Field(() => GherkinsQuestion)
  question: GherkinsQuestion;

  @Field()
  nAnswers: number;

  @Field()
  isValidQuestion: boolean;

  @Field(() => [Answer])
  answers: Answer[];
}
