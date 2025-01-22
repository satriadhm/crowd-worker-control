import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Auth } from './models/auth';
import { AuthService } from './services/auth.service';
import { AuthView } from './dto/views/auth.view';
import { LoginInput, RegisterInput } from './dto/inputs/create.auth.input';
import { UserView } from 'src/users/dto/views/user.view';
import { UseGuards } from '@nestjs/common';
import { Roles } from './decorators/role.decorator';
import { RolesGuard } from './guards/role.guard';

@Resolver(() => Auth)
@UseGuards(RolesGuard)
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

  @Query(() => UserView)
  @Roles('admin', 'worker')
  async me(@Args('token') token: string): Promise<UserView> {
    return this.authService.getLoggedInUser(token);
  }
}
