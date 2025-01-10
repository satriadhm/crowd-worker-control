import { InputType, Field } from '@nestjs/graphql';
import { Role } from 'src/lib/user.enum';

@InputType()
export class RegisterInput {
  @Field()
  email: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  password: string;

  @Field()
  passwordConfirmation: string;

  @Field(() => Role)
  role: Role;
}

@InputType()
export class LoginInput {
  @Field()
  email: string;

  @Field()
  password: string;
}

@InputType()
export class ForgotPasswordInput {
  @Field()
  email: string;
}
