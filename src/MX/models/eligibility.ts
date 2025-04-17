import { ObjectType, Field } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
@ObjectType()
export class Eligibility {
  @Field(() => String)
  @Prop({ type: Types.ObjectId, ref: 'Task', required: true })
  taskId: string;

  @Field(() => String)
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  workerId: string;

  @Field({ nullable: true })
  @Prop({ default: null })
  accuracy?: number;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

export type EligibilityDocument = HydratedDocument<Eligibility>;
export const EligibilitySchema = SchemaFactory.createForClass(Eligibility);
