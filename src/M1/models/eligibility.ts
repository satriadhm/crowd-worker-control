import { ObjectType, Field } from '@nestjs/graphql';
import { Prop, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@ObjectType()
export class Eligibility {
  @Field()
  @Prop({ type: Types.ObjectId, ref: 'Task', required: true })
  taskId: string;

  @Field()
  @Prop({ type: Types.ObjectId, ref: 'Users', required: true })
  workerId: string;

  @Field()
  @Prop({ required: true })
  answer: string;

  @Field({ nullable: true })
  @Prop({ default: null })
  accuracy?: number;

  @Field()
  @Prop({ default: false })
  eligible: boolean;
}

export type EligibilityDocument = HydratedDocument<Eligibility>;
export const EligibilitysSchema = SchemaFactory.createForClass(Eligibility);
