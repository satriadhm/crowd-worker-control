import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UserView {
  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  userName: string;

  @Field()
  email: string;

  @Field()
  age: number;

  @Field()
  phoneNumber: string;

  @Field()
  gender: string;

  @Field()
  role: string;

  @Field()
  address1: string;

  @Field()
  address2: string;
}
