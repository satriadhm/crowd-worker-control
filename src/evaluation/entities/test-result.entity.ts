import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Field, ObjectType } from '@nestjs/graphql';

@Schema({ timestamps: true })
@ObjectType()
export class TestResult {
  @Field()
  _id: string;

  @Prop({ required: true })
  @Field()
  workerId: string;

  @Prop({ required: true })
  @Field()
  testId: string;

  @Prop({ required: true })
  @Field()
  score: number;

  @Prop()
  @Field({ nullable: true })
  feedback?: string;

  @Prop()
  @Field()
  createdAt: Date;

  @Prop()
  @Field()
  updatedAt: Date;
}
export type TestResultDocument = HydratedDocument<TestResult>;
export const TestResultSchema = SchemaFactory.createForClass(TestResult);
