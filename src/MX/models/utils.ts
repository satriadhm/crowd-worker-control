import { ObjectType, Field } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum ThresholdType {
  MEDIAN = 'median',
  MEAN = 'mean',
  CUSTOM = 'custom',
}

@Schema()
@ObjectType()
export class Utils {
  @Field(() => String)
  @Prop({
    type: String,
    enum: ThresholdType,
    default: ThresholdType.MEDIAN,
  })
  thresholdType: ThresholdType;

  @Field()
  @Prop({ default: 0.7 }) // Default threshold value is 0.7 (70%)
  thresholdValue: number;

  @Field(() => Date)
  @Prop({ default: Date.now })
  lastUpdated: Date;
}

export type UtilsDocument = HydratedDocument<Utils>;
export const UtilsSchema = SchemaFactory.createForClass(Utils);
