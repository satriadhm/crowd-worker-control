import { InputType, Field } from '@nestjs/graphql';
import { Role } from 'src/lib/user.enum';

@InputType()
export class CreateUserInput {
  @Field()
  email: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  userName: string;

  @Field()
  password: string;

  @Field()
  passwordConfirmation: string;

  @Field(() => Role)
  role: Role;
}
