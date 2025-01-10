import { CreateUserInput } from './create.user.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateWorkerInput extends PartialType(CreateUserInput) {
  @Field(() => Int)
  id: number;
}
