import { CreateUserInput } from './create.user.input';
import { InputType, Field, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateUserInput extends PartialType(CreateUserInput) {
  @Field(() => String)
  id: string;

  @Field()
  phoneNumber: string;

  @Field()
  address1: string;

  @Field()
  address2: string;
}
