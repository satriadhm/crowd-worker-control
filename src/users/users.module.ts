import { Module } from '@nestjs/common';
import { UsersResolver } from './users.resolver';
import { CreateUserService } from './services/create.user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Users, UsersSchema } from './models/user';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Users.name, schema: UsersSchema }]),
  ],
  providers: [UsersResolver, CreateUserService],
  exports: [CreateUserService],
})
export class WorkersModule {}
