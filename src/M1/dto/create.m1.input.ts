import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateM1Input {
  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;
}
