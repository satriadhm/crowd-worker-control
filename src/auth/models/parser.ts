import { CreateUserInput } from 'src/users/dto/inputs/create.user.input';
import { RegisterInput } from '../dto/inputs/create.auth.input';

export function parseRegisterInput(input: RegisterInput): CreateUserInput {
  return {
    email: input.email,
    firstName: input.firstName,
    lastName: input.lastName,
    password: input.password,
    passwordConfirmation: input.passwordConfirmation,
    role: input.role,
  };
}
