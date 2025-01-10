import { ArgsType, Field } from '@nestjs/graphql';

@ArgsType()
export class GetUserArgs {
  @Field({ nullable: true })
  id: number;

  @Field({ nullable: true })
  skip: number;

  @Field({ nullable: true })
  take: number;
}
