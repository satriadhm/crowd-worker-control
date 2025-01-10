import { Module } from '@nestjs/common';
import { AuthResolver } from './auth.resolver';
import { WorkersModule } from 'src/users/users.module';
import { AuthService } from './services/auth.service';

@Module({
  imports: [WorkersModule],
  providers: [AuthResolver, AuthService],
})
export class AuthModule {}
