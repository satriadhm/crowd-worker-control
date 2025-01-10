import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { WorkersService } from './services/get.user.service';
import { Worker } from './models/user.entity';
import { CreateUserInput } from './dto/inputs/create.user.input';
import { UpdateWorkerInput } from './dto/inputs/update.user.input';

@Resolver(() => Worker)
export class WorkersResolver {
  constructor(private readonly workersService: WorkersService) {}

  @Mutation(() => Worker)
  createWorker(@Args('CreateUserInput') CreateUserInput: CreateUserInput) {
    return this.workersService.create(CreateUserInput);
  }

  @Query(() => [Worker], { name: 'workers' })
  findAll() {
    return this.workersService.findAll();
  }

  @Query(() => Worker, { name: 'worker' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.workersService.findOne(id);
  }

  @Mutation(() => Worker)
  updateWorker(@Args('updateWorkerInput') updateWorkerInput: UpdateWorkerInput) {
    return this.workersService.update(updateWorkerInput.id, updateWorkerInput);
  }

  @Mutation(() => Worker)
  removeWorker(@Args('id', { type: () => Int }) id: number) {
    return this.workersService.remove(id);
  }
}
