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

@Resolver(() => Users)
@UseGuards(RolesGuard)
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
  @Roles('admin')
  async deleteUser(id: string): Promise<UserView> {
    return this.deleteUserService.delete(id);
  }

  @Query(() => [UserView])
  @Roles('admin')
  async getAllUsers(@Args() args: GetUserArgs): Promise<UserView[]> {
    return this.getUserService.getAllUsers(args);
  }

  @Query(() => UserView)
  async getUserByUsername(userName: string): Promise<UserView> {
    return this.getUserService.getUserByUsername(userName);
  }

  @Query(() => UserView)
  async getUserByEmail(email: string): Promise<UserView> {
    return this.getUserService.getUserByEmail(email);
  }

  @Query(() => UserView)
  async getUserById(id: string): Promise<UserView> {
    return this.getUserService.getUserById(id);
  }
}
