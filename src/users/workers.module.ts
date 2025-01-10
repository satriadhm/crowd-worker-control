import { Module } from '@nestjs/common';
import { WorkersResolver } from './workers.resolver';
import { CreateWorkerService } from './services/create.user.service';

@Module({
  providers: [WorkersResolver, CreateWorkerService],
  exports: [CreateWorkerService],
})
export class WorkersModule {}
