import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Users, UsersSchema } from './models/user';
import { UsersResolver } from './users.resolver';
import { CreateUserService } from './services/create.user.service';
import { GetUserService } from './services/get.user.service';
import { UpdateUserService } from './services/update.user.service';
import { DeleteUserService } from './services/delete.user.service';
import { M1Module } from '../MX/mx.module';
import { Eligibility, EligibilitySchema } from '../MX/models/eligibility';

@Module({
  imports: [
    forwardRef(() => M1Module),
    MongooseModule.forFeature([
      { name: Users.name, schema: UsersSchema },
      { name: Eligibility.name, schema: EligibilitySchema },
    ]),
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
