import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Role } from 'src/lib/user.enum';

@InputType()
export class RegisterInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @IsNotEmpty()
  firstName: string;

  @Field()
  @IsNotEmpty()
  lastName: string;

  @Field()
  @IsNotEmpty()
  userName: string;

  @Field()
  @MinLength(8)
  password: string;

  @Field()
  @MinLength(8)
  passwordConfirmation: string;

  @Field(() => Role)
  role: Role;
}

@InputType()
export class LoginInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

@InputType()
export class ForgotPasswordInput {
  @Field()
  email: string;
}
