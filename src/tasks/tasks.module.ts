import { Module } from '@nestjs/common';
import { TasksResolver } from './tasks.resolver';
import { Task, TaskSchema } from './models/task';
import { MongooseModule } from '@nestjs/mongoose';
import { CreateTaskService } from './services/create.task.service';
import { GetTaskService } from './services/get.task.service';
import { UpdateTaskService } from './services/update.task.service';
import { DeleteTaskService } from './services/delete.task.service';
import { UsersModule } from 'src/users/users.module';
import { AuthModule } from 'src/auth/auth.module';
import { CountTaskService } from './services/count.task.service';
import { M1Module } from 'src/M1/m1.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Task.name, schema: TaskSchema }]),
    TasksModule,
    M1Module,
    UsersModule,
    AuthModule,
  ],
  providers: [
    TasksResolver,
    CreateTaskService,
    GetTaskService,
    UpdateTaskService,
    DeleteTaskService,
    CountTaskService,
  ],
  exports: [
    CreateTaskService,
    GetTaskService,
    UpdateTaskService,
    DeleteTaskService,
    CountTaskService,
  ],
})
export class TasksModule {}
