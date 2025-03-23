import { Resolver, Mutation, Args, Query, Context } from '@nestjs/graphql';
import { Roles } from 'src/auth/decorators/role.decorator';
import { Role } from 'src/lib/user.enum';
import { CreateRecordedService } from './services/recorded/create.recorded.service';
import { GetElibilityService } from './services/eligibility/get.eligibility.service';
import { EligibilityView } from './dto/eligibility/views/eligibility.view';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';

@Resolver()
@UseGuards(RolesGuard, JwtAuthGuard)
export class M1Resolver {
  constructor(
    private readonly GetElibilityService: GetElibilityService,
    private readonly createRecordedService: CreateRecordedService,
  ) {}

  @Mutation(() => Boolean)
  @Roles(Role.WORKER)
  async submitAnswer(
    @Args('taskId') taskId: string,
    @Args('answer') answer: string,
    @Context() context: any,
  ): Promise<boolean> {
    const workerId = context.req.user.id;
    console.log(workerId);
    await this.createRecordedService.recordAnswer(taskId, workerId, answer);
    return true;
  }

  @Query(() => [EligibilityView])
  @Roles(Role.WORKER, Role.ADMIN)
  async getEligibilityHistory(
    @Args('workerId') workerId: string,
  ): Promise<EligibilityView[]> {
    return this.GetElibilityService.getEligibilityHistoryWorkerId(workerId);
  }
}
