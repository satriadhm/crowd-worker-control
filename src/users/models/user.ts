import { ObjectType, Field } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Gender, Role } from 'src/lib/user.enum';

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
  @Prop({ type: String, required: true })
  gender: Gender;

  @Field(() => Role)
  @Prop({ type: String, required: true })
  role: Role;

  @Field()
  @Prop({ required: true })
  address1: string;

  @Field()
  @Prop({ required: true })
  address2: string;
}

export type UserDocument = HydratedDocument<Users>;
export const UsersSchema = SchemaFactory.createForClass(Users);
