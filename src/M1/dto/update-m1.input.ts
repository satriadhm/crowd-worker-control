import { CreateM1Input } from './create-m1.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateM1Input extends PartialType(CreateM1Input) {
  @Field(() => Int)
  id: number;
}
