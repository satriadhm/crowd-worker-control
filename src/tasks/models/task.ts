import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema()
@ObjectType()
export class Task {
  @Field()
  @Prop({ required: true })
  id: string;

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

export class Answer {
  @Field()
  @Prop({ required: true })
  workerId: string; // Link to User
  @Field()
  @Prop({ required: true })
  answer: string;
  @Field()
  @Prop({ required: true })
  stats: number;
}

export type TaskDocument = HydratedDocument<Task>;
export const TaskSchema = SchemaFactory.createForClass(Task);
