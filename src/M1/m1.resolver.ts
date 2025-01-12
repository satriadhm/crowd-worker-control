// src/M1/m1.resolver.ts
import { Resolver } from '@nestjs/graphql';
import { M1Service } from './services/m1.service';
import { GetTaskService } from '../tasks/services/get.task.service';

@Resolver()
export class M1Resolver {
  constructor(
    private readonly m1Service: M1Service,
    private readonly getTaskService: GetTaskService,
  ) {}
}
