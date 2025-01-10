import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema } from '@nestjs/mongoose';

@Schema()
@ObjectType()
export class Task {
  @Field()
  @Prop({ required: true })
  id: string;

  @Field()
  @Prop({ required: true })
  question: string;

  // create an object for set of questions and answers
}

export class QuestionAnswer {
  @Field()
  @Prop({ required: true })
  nQuestion: number;

  @Field()
  @Prop({ type: [String], required: true })
  question: string[];

  @Field()
  @Prop({ type: [String], required: true })
  answer: string[];
}
