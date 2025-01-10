import { ObjectType, Field } from '@nestjs/graphql';
import { Prop, Schema } from '@nestjs/mongoose';
import { Gender } from 'src/lib/user.enum';

@Schema()
@ObjectType()
export class Users {
  @Field()
  @Prop({ required: true })
  id: string;

  @Field()
  @Prop({ required: true })
  firstName: string;

  @Field()
  @Prop({ required: true })
  lastName: string;

  @Field()
  @Prop({ required: true })
  userName: string;

  @Field()
  @Prop({ required: true })
  email: string;

  @Field()
  @Prop({ required: true })
  password: string;

  @Field()
  @Prop({ required: true })
  age: number;

  @Field()
  @Prop({ required: true })
  phoneNumber: string;

  @Field(() => Gender)
  @Prop({ required: true })
  gender: Gender;

  @Field()
  @Prop({ required: true })
  address1: string;

  @Field()
  @Prop({ required: true })
  address2: string;
}
