import { Resolver, Mutation, Args, Query, Context } from '@nestjs/graphql';
import { Roles } from 'src/auth/decorators/role.decorator';
import { Role } from 'src/lib/user.enum';
import { CreateRecordedService } from './services/recorded/create.recorded.service';
import { GetEligibilityService } from './services/eligibility/get.eligibility.service';
import { EligibilityView } from './dto/eligibility/views/eligibility.view';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { UpdateUserService } from '../users/services/update.user.service';
import { CreateRecordedAnswerInput } from './dto/recorded/create.recorded.input';

@Resolver()
@UseGuards(RolesGuard, JwtAuthGuard)
export class M1Resolver {
  constructor(
    private readonly GetEligibilityService: GetEligibilityService,
    private readonly createRecordedService: CreateRecordedService,
    private readonly updateUserService: UpdateUserService,
  ) {}

  @Mutation(() => Boolean)
  @Roles(Role.WORKER)
  async submitAnswer(
    @Args('input') input: CreateRecordedAnswerInput,
    @Context() context: any,
  ): Promise<boolean> {
    const workerId = context.req.user.id;
    await this.createRecordedService.recordAnswer(input, workerId);
    await this.updateUserService.userHasDoneTask(input, workerId);
    return true;
  }

  @Query(() => [EligibilityView])
  @Roles(Role.WORKER, Role.ADMIN)
  async getEligibilityHistory(
    @Args('workerId') workerId: string,
  ): Promise<EligibilityView[]> {
    return this.GetEligibilityService.getEligibilityWorkerId(workerId);
  }
}
