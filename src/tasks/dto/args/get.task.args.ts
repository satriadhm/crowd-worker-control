import { ArgsType, Field } from '@nestjs/graphql';

@ArgsType()
export class GetTaskArgs {
  @Field({ nullable: true })
  question: string;

  @Field({ nullable: true })
  skip: number;

  @Field({ nullable: true })
  take: number;
}
