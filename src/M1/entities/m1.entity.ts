import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class M1 {
  @Field(() => Int, { description: 'Example field (placeholder)' })
  exampleField: number;
}
