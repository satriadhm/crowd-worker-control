import { ObjectType, Field } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Gender, Role } from 'src/lib/user.enum';

@Schema()
@ObjectType()
export class Users {
  @Field()
  @Prop({ required: true })
  _id: string;

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
  @Prop({ required: false })
  age: number;

  @Field()
  @Prop({ required: false })
  phoneNumber: string;

  @Field(() => Gender)
  @Prop({ type: String, required: false })
  gender: Gender;

  @Field(() => Role)
  @Prop({ type: String, required: false })
  role: Role;

  @Field()
  @Prop({ required: false })
  address1: string;

  @Field()
  @Prop({ required: false })
  address2: string;

  @Prop({
    required: function () {
      return this.role === 'worker';
    },
    default: false,
  })
  isEligible: boolean;

  @Prop({
    type: [Types.ObjectId],
    ref: 'Tasks',
    required: function () {
      return this.role === 'worker';
    },
    default: [],
  })
  isDoneTaskIds: string[];
}

export type UserDocument = HydratedDocument<Users>;
export const UsersSchema = SchemaFactory.createForClass(Users);
