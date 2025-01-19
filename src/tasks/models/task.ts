import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@ObjectType()
export class Answer {
  @Field({ nullable: true })
  @Prop({ required: false })
  workerId: string; // Link to User
  @Field({ nullable: true })
  @Prop({ required: false })
  answer: string;
  @Field({ nullable: true })
  @Prop({ required: false })
  stats: number;
}
@Schema()
@ObjectType()
export class Task {
  @Field()
  @Prop({ required: true })
  _id: string;

  @Field()
  @Prop({ required: true })
  title: string;

  @Field({ nullable: true })
  @Prop({ required: false })
  description: string;

  @Field()
  @Prop({ required: true })
  question: string;

  @Field()
  @Prop({ required: true })
  nAnswers: number;

  @Field(() => [Answer])
  @Prop({ required: true })
  answers: Answer[];
}

export type TaskDocument = HydratedDocument<Task>;
export const TaskSchema = SchemaFactory.createForClass(Task);
