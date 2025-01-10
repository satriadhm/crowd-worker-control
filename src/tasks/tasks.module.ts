import { Module } from '@nestjs/common';
import { TasksService } from './services/tasks.service';
import { TasksResolver } from './tasks.resolver';

@Module({
  providers: [TasksResolver, TasksService],
})
export class TasksModule {}
