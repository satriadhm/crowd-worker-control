import { Module } from '@nestjs/common';
import { AuthResolver } from './auth.resolver';
import { WorkersModule } from 'src/users/users.module';
import { AuthService } from './services/auth.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Auth, AuthSchema } from './models/auth';

@Module({
  imports: [
    WorkersModule,
    MongooseModule.forFeature([{ name: Auth.name, schema: AuthSchema }]),
  ],
  providers: [AuthResolver, AuthService],
})
export class AuthModule {}
