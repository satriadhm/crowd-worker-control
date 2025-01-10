import { Module } from '@nestjs/common';
import { UsersResolver } from './users.resolver';
import { CreateWorkerService } from './services/create.user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Users, UsersSchema } from './models/user';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Users.name, schema: UsersSchema }]),
  ],
  providers: [UsersResolver, CreateWorkerService],
  exports: [CreateWorkerService],
})
export class WorkersModule {}
