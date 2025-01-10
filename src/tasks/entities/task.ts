import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema } from '@nestjs/mongoose';

@Schema()
@ObjectType()
export class Task {
  @Field()
  @Prop({ required: true })
  id: string;
}
