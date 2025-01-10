import { Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateTaskService } from './services/create.task.service';
import { Task } from './models/task';
import { GetTaskService } from './services/get.task.service';
import { DeleteTaskService } from './services/delete.task.service';
import { TaskView } from './dto/views/task.view.input';
import { CreateTaskInput } from './dto/inputs/create.task.input';
import { GetTaskArgs } from './dto/args/get.task.args';

@Resolver(() => Task)
export class TasksResolver {
  constructor(
    private createTaskService: CreateTaskService,
    private getTaskService: GetTaskService,
    private deleteTaskService: DeleteTaskService,
  ) {}

  @Mutation(() => TaskView)
  async createTask(input: CreateTaskInput): Promise<TaskView> {
    return this.createTaskService.createTask(input);
  }

  @Query(() => TaskView)
  async getTaskById(id: string): Promise<TaskView> {
    return this.getTaskService.getTaskById(id);
  }

  @Query(() => [TaskView])
  async getTasks(args: GetTaskArgs): Promise<TaskView[]> {
    return this.getTaskService.getTasks(args);
  }

  @Mutation(() => TaskView)
  async deleteTask(id: string): Promise<TaskView> {
    return this.deleteTaskService.delete(id);
  }
}
