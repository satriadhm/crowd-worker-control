// src/M1/m1.resolver.ts
import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { M1Service } from './services/m1.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { Roles } from 'src/auth/decorators/role.decorator';

@Resolver()
@UseGuards(JwtAuthGuard, RolesGuard)
export class M1Resolver {
  constructor(private readonly m1Service: M1Service) {}

  @Mutation(() => Boolean)
  @Roles('admin')
  async assignTask(
    @Args('taskId') taskId: string,
    @Args('workerId') workerId: string,
  ): Promise<boolean> {
    await this.m1Service.assignTaskToWorker(taskId, workerId);
    return true;
  }

  @Mutation(() => Boolean)
  @Roles('worker')
  async submitAnswer(
    @Args('taskId') taskId: string,
    @Args('workerId') workerId: string,
    @Args('answer') answer: string,
  ): Promise<boolean> {
    await this.m1Service.recordAnswer(taskId, workerId, answer);
    return true;
  }

  @Query(() => [String])
  @Roles('admin')
  async getEligibleWorkers(@Args('taskId') taskId: string): Promise<string[]> {
    const eligibleWorkers = await this.m1Service.getEligibleWorkers(taskId);
    return eligibleWorkers;
  }
}
