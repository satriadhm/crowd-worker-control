// Correct pre-update hook implementation for TypeScript

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

  // Perbaikan pada field isEligible
  @Field(() => Boolean, { nullable: true })
  @Prop({
    type: Boolean,
    required: false,
    default: null,
  })
  isEligible: boolean | null;

  @Field(() => [TaskCompletion])
  @Prop({
    type: [{ taskId: String, answer: String }],
    required: function () {
      return this.role === 'worker';
    },
    default: [],
  })
  completedTasks: { taskId: string; answer: string }[];

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<Users>;
export const UsersSchema = SchemaFactory.createForClass(Users);

// Perbaikan hook untuk TypeScript
UsersSchema.pre('findOneAndUpdate', function () {
  // Gunakan any untuk mengatasi masalah TypeScript dengan Mongoose update object
  const update = this.getUpdate() as any;

  if (update && update.$set && update.$set.isEligible !== undefined) {
    // Jika nilai bukan null, pastikan itu boolean yang sesungguhnya
    if (update.$set.isEligible !== null) {
      update.$set.isEligible = Boolean(update.$set.isEligible);
    }
  }
});
