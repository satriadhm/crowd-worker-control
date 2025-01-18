import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Users, UsersSchema } from './models/user';
import { UsersResolver } from './users.resolver';
import { CreateUserService } from './services/create.user.service';
import { GetUserService } from './services/get.user.service';
import { UpdateUserService } from './services/update.user.service';
import { DeleteUserService } from './services/delete.user.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Users.name, schema: UsersSchema }]),
  ],
  providers: [
    UsersResolver,
    CreateUserService,
    GetUserService,
    UpdateUserService,
    DeleteUserService,
  ],
  exports: [
    CreateUserService,
    GetUserService,
    UpdateUserService,
    DeleteUserService,
  ],
})
export class UsersModule {}
