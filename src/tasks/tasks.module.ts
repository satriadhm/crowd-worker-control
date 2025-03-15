import { forwardRef, Module } from '@nestjs/common';
import { TasksResolver } from './tasks.resolver';
import { Task, TaskSchema } from './models/task';
import { MongooseModule } from '@nestjs/mongoose';
import { CreateTaskService } from './services/create.task.service';
import { GetTaskService } from './services/get.task.service';
import { UpdateTaskService } from './services/update.task.service';
import { DeleteTaskService } from './services/delete.task.service';
import { UsersModule } from 'src/users/users.module';
import { AuthModule } from 'src/auth/auth.module';
import { M1Module } from 'src/M1/m1.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Task.name, schema: TaskSchema }]),
    forwardRef(() => M1Module),
    UsersModule,
    AuthModule,
  ],
  providers: [
    TasksResolver,
    CreateTaskService,
    GetTaskService,
    UpdateTaskService,
    DeleteTaskService,
  ],
  exports: [
    CreateTaskService,
    GetTaskService,
    UpdateTaskService,
    DeleteTaskService,
  ],
})
export class TasksModule {}
