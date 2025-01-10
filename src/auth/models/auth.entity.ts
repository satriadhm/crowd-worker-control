import { ObjectType, Field } from '@nestjs/graphql';
import { RegisterInput } from '../dto/inputs/create.auth.input';
import { CreateUserInput } from 'src/users/dto/inputs/create.user.input';

@ObjectType()
export class Auth {
  @Field()
  authId: string;

  @Field()
  accessToken: string;

  @Field()
  refreshToken: string;
}

export function parseRegisterInput(input: RegisterInput): CreateUserInput {
  return {
    email: input.email,
    firstName: input.firstName,
    lastName: input.lastName,
    password: input.password,
    passwordConfirmation: input.passwordConfirmation,
    role: 'user',
  };
}
