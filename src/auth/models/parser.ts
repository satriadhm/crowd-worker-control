import { CreateUserInput } from 'src/users/dto/inputs/create.user.input';
import { RegisterInput } from '../dto/inputs/create.auth.input';
import { GQLThrowType, ThrowGQL } from '@app/gqlerr';
import * as bcrypt from 'bcrypt';

export async function parseRegisterInput(
  input: RegisterInput,
): Promise<CreateUserInput> {
  if (input.password !== input.passwordConfirmation) {
    throw new ThrowGQL('Passwords do not match', GQLThrowType.NOT_FOUND);
  }

  // Enkripsi password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(input.password, saltRounds);

  return {
    email: input.email,
    firstName: input.firstName,
    lastName: input.lastName,
    userName: input.userName,
    password: hashedPassword,
    passwordConfirmation: hashedPassword,
    role: input.role,
  };
}
