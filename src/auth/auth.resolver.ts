import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Auth } from './models/auth';
import { AuthService } from './services/auth.service';
import { AuthView } from './dto/views/auth.view';
import { LoginInput, RegisterInput } from './dto/inputs/create.auth.input';

@Resolver(() => Auth)
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthView)
  async login(@Args('input') input: LoginInput): Promise<AuthView> {
    return this.authService.login(input);
  }

  @Mutation(() => AuthView)
  async register(@Args('input') input: RegisterInput): Promise<AuthView> {
    return this.authService.register(input);
  }
}
