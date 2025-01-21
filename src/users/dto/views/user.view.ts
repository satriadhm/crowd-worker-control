import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UserView {
  @Field({ nullable: true })
  firstName: string;

  @Field({ nullable: true })
  lastName: string;

  @Field({ nullable: true })
  userName: string;

  @Field({ nullable: true })
  email: string;

  @Field({ nullable: true })
  age: number;

  @Field({ nullable: true })
  phoneNumber: string;

  @Field({ nullable: true })
  gender: string;

  @Field({ nullable: true })
  role: string;

  @Field({ nullable: true })
  address1: string;

  @Field({ nullable: true })
  address2: string;
}
