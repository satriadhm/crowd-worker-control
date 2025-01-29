import { ObjectType, Field } from '@nestjs/graphql';
import { Prop, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { RecordedAnswer } from './recorded';

@ObjectType()
export class Eligibility {
  @Field()
  @Prop({ type: [Types.ObjectId], ref: 'WorkerTasks', default: [] })
  taskIds: string[];

  @Field()
  @Prop({ type: Types.ObjectId, ref: 'Users', required: true })
  workerId: string;

  @Prop({ type: [Types.ObjectId], ref: 'RecordedAnswer', default: [] })
  answers: RecordedAnswer[];

  @Field({ nullable: true })
  @Prop({ default: null })
  accuracy?: number;

  @Field()
  @Prop({ default: false })
  eligible: boolean;
}

export type EligibilityDocument = HydratedDocument<Eligibility>;
export const EligibilitysSchema = SchemaFactory.createForClass(Eligibility);
