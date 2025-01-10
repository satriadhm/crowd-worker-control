import { Resolver } from '@nestjs/graphql';
import { Auth } from './models/auth';
import { AuthService } from './services/auth.service';

@Resolver(() => Auth)
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}
}
