import { ObjectType, Field } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Gender, Role } from 'src/lib/user.enum';

@ObjectType()
export class TaskCompletion {
  @Field()
  taskId: string;

  @Field()
  answer: string;
}

// Use timestamps to track user creation order for iterations
@Schema({ timestamps: true })
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

  // isEligible is now undefined by default and not required initially
  // It will be set based on the iteration-based evaluation
  @Field(() => Boolean, { nullable: true })
  @Prop({
    type: Boolean,
    required: false,
    default: undefined,
  })
  isEligible?: boolean;

  @Field(() => [TaskCompletion])
  @Prop({
    type: [{ taskId: String, answer: String }],
    required: function () {
      return this.role === 'worker';
    },
    default: [],
  })
  completedTasks: { taskId: string; answer: string }[];

  // Add created/updated timestamps for tracking iteration eligibility
  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<Users>;
export const UsersSchema = SchemaFactory.createForClass(Users);
