import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateTaskService } from './services/create.task.service';
import { Task } from './models/task';
import { GetTaskService } from './services/get.task.service';
import { DeleteTaskService } from './services/delete.task.service';
import { TaskView } from './dto/views/task.view.input';
import { CreateTaskInput } from './dto/inputs/create.task.input';
import { GetTaskArgs } from './dto/args/get.task.args';
import { UpdateTaskService } from './services/update.task.service';
import { UpdateTaskInput } from './dto/inputs/update.task.input';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { Roles } from 'src/auth/decorators/role.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { Role } from 'src/lib/user.enum';

@Resolver(() => Task)
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksResolver {
  constructor(
    private createTaskService: CreateTaskService,
    private getTaskService: GetTaskService,
    private deleteTaskService: DeleteTaskService,
    private updateTaskService: UpdateTaskService,
  ) {}

  @Mutation(() => TaskView)
  @Roles(Role.ADMIN, Role.QUESTION_VALIDATOR)
  async createTask(@Args('input') input: CreateTaskInput): Promise<TaskView> {
    return this.createTaskService.createTask(input);
  }

  @Mutation(() => TaskView)
  @Roles(Role.ADMIN, Role.QUESTION_VALIDATOR)
  async updateTask(@Args('input') input: UpdateTaskInput): Promise<TaskView> {
    return this.updateTaskService.updateTask(input);
  }

  @Query(() => TaskView)
  @Roles(Role.ADMIN, Role.QUESTION_VALIDATOR, Role.WORKER)
  async getTaskById(@Args('id') id: string): Promise<TaskView> {
    return this.getTaskService.getTaskById(id);
  }

  @Query(() => [TaskView])
  @Roles(Role.ADMIN, Role.QUESTION_VALIDATOR, Role.WORKER)
  async getTasks(@Args() args: GetTaskArgs): Promise<TaskView[]> {
    return this.getTaskService.getTasks(args);
  }

  @Mutation(() => TaskView)
  @Roles(Role.ADMIN, Role.QUESTION_VALIDATOR)
  async deleteTask(@Args('id') id: string): Promise<TaskView> {
    return this.deleteTaskService.delete(id);
  }

  @Query(() => Number)
  @Roles(Role.WORKER, Role.ADMIN, Role.QUESTION_VALIDATOR)
  async getTotalTasks(): Promise<number> {
    return this.getTaskService.getTotalTasks();
  }

  @Mutation(() => TaskView)
  @Roles(Role.QUESTION_VALIDATOR)
  async validateQuestionTask(@Args('id') id: string): Promise<void> {
    return this.updateTaskService.validateQuestionTask(id);
  }
}
