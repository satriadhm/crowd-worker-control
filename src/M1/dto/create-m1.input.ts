import { InputType, Int, Field } from '@nestjs/graphql';

@InputType()
export class CreateM1Input {
  @Field(() => Int, { description: 'Example field (placeholder)' })
  exampleField: number;
}
