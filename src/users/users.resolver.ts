import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Users } from './models/user';
import { DeleteUserService } from './services/delete.user.service';
import { CreateUserService } from './services/create.user.service';
import { UpdateUserService } from './services/update.user.service';
import { UserView } from './dto/views/user.view';
import { CreateUserInput } from './dto/inputs/create.user.input';
import { UpdateUserInput } from './dto/inputs/update.user.input';
import { Query } from '@nestjs/graphql';
import { GetUserArgs } from './dto/args/get.user.args';
import { GetUserService } from './services/get.user.service';
import { UseGuards } from '@nestjs/common';
import { Roles } from 'src/auth/decorators/role.decorator';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { Role } from 'src/lib/user.enum';
import { CreateRecordedAnswerInput } from 'src/MX/dto/recorded/create.recorded.input';

@Resolver(() => Users)
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersResolver {
  constructor(
    private readonly createUserService: CreateUserService,
    private readonly updateUserService: UpdateUserService,
    private readonly deleteUserService: DeleteUserService,
    private readonly getUserService: GetUserService,
  ) {}

  @Mutation(() => UserView)
  async createUser(@Args('input') input: CreateUserInput): Promise<UserView> {
    return this.createUserService.create(input);
  }

  @Mutation(() => UserView)
  async updateUser(@Args('input') input: UpdateUserInput): Promise<UserView> {
    return this.updateUserService.updateUser(input);
  }

  @Mutation(() => UserView)
  @Roles(Role.ADMIN)
  async deleteUser(@Args('id') id: string): Promise<UserView> {
    return this.deleteUserService.delete(id);
  }

  @Mutation(() => UserView)
  @Roles(Role.WORKER)
  async userHasDoneTask(
    @Args('input') input: CreateRecordedAnswerInput,
    @Args('userId') userId: string,
  ): Promise<UserView> {
    return this.updateUserService.userHasDoneTask(input, userId);
  }

  @Mutation(() => UserView)
  @Roles(Role.WORKER)
  async resetHasDoneTask(@Args('id') id: string): Promise<UserView> {
    return this.deleteUserService.resetHasDoneTask(id);
  }

  @Query(() => [UserView])
  @Roles(Role.ADMIN)
  async getAllUsers(@Args() args: GetUserArgs): Promise<UserView[]> {
    return this.getUserService.getAllUsers(args);
  }

  @Query(() => UserView)
  @Roles(Role.ADMIN)
  async getUserByUsername(
    @Args('username') userName: string,
  ): Promise<UserView> {
    return this.getUserService.getUserByUsername(userName);
  }

  @Query(() => UserView)
  @Roles(Role.ADMIN)
  async getUserByEmail(@Args('email') email: string): Promise<UserView> {
    return this.getUserService.getUserByEmail(email);
  }

  @Query(() => UserView)
  @Roles(Role.ADMIN)
  async getUserById(@Args('id') id: string): Promise<UserView> {
    return this.getUserService.getUserById(id);
  }

  @Query(() => Number)
  @Roles(Role.WORKER, Role.ADMIN)
  async getTotalUsers(): Promise<number> {
    return this.getUserService.getTotalUsers();
  }
}
