import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AuthView {
  @Field()
  accessToken: string;

  @Field()
  refreshToken: string;

  @Field()
  userId: string;
}
