import { ObjectType, Field } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { RecordedAnswer } from './recorded';

@Schema()
@ObjectType()
export class Eligibility {
  @Field(() => [String]) // Pastikan GraphQL mengetahui tipe data
  @Prop({ type: [Types.ObjectId], ref: 'WorkerTasks', default: [] })
  taskIds: string[];

  @Field(() => String)
  @Prop({ type: Types.ObjectId, ref: 'Users', required: true })
  workerId: string;

  @Field(() => [RecordedAnswer]) // Pastikan GraphQL mengetahui tipe data
  @Prop({ type: [Types.ObjectId], ref: 'RecordedAnswer', default: [] })
  answers: RecordedAnswer[];

  @Field({ nullable: true })
  @Prop({ default: null })
  accuracy?: number;

  @Field(() => Boolean)
  @Prop({ default: false })
  eligible: boolean;
}

export type EligibilityDocument = HydratedDocument<Eligibility>;
export const EligibilitySchema = SchemaFactory.createForClass(Eligibility);
