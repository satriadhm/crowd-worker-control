// src/M1/m1.resolver.ts
import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { M1Service } from './services/m1.service';

@Resolver()
export class M1Resolver {
  constructor(private readonly m1Service: M1Service) {}

  @Mutation(() => Boolean)
  async assignTask(
    @Args('taskId') taskId: string,
    @Args('workerId') workerId: string,
  ): Promise<boolean> {
    await this.m1Service.assignTaskToWorker(taskId, workerId);
    return true;
  }

  @Mutation(() => Boolean)
  async submitAnswer(
    @Args('taskId') taskId: string,
    @Args('workerId') workerId: string,
    @Args('answer') answer: string,
  ): Promise<boolean> {
    await this.m1Service.recordAnswer(taskId, workerId, answer);
    return true;
  }

  @Query(() => [String])
  async getEligibleWorkers(@Args('taskId') taskId: string): Promise<string[]> {
    const eligibleWorkers = await this.m1Service.getEligibleWorkers(taskId);
    return eligibleWorkers;
  }
}
