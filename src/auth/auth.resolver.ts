import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
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
    const result = await this.authService.login(input);

    return result;
  }

  @Mutation(() => AuthView)
  async register(@Args('input') input: RegisterInput): Promise<AuthView> {
    const result = await this.authService.register(input);

    return result;
  }

  @Query(() => UserView)
  @Roles('admin', 'worker')
  async me(@Args('token') token: string): Promise<UserView> {
    return this.authService.getLoggedInUser(token);
  }

  @Mutation(() => Boolean)
  async logout(@Context() context): Promise<boolean> {
    const token = context.req.headers.authorization?.split(' ')[1];
    if (!token) throw new Error('No token provided');
    await this.authService.logout(token);
    return true;
  }
}
