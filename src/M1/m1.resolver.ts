import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { M1Service } from './services/m1.service';
import { M1 } from './models/m1.entity';
import { CreateM1Input } from './dto/create-m1.input';
import { UpdateM1Input } from './dto/update-m1.input';

@Resolver(() => M1)
export class M1Resolver {
  constructor(private readonly m1Service: M1Service) {}

  @Mutation(() => M1)
  createM1(@Args('createM1Input') createM1Input: CreateM1Input) {
    return this.m1Service.create(createM1Input);
  }

  @Query(() => [M1], { name: 'm1' })
  findAll() {
    return this.m1Service.findAll();
  }

  @Query(() => M1, { name: 'm1' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.m1Service.findOne(id);
  }

  @Mutation(() => M1)
  updateM1(@Args('updateM1Input') updateM1Input: UpdateM1Input) {
    return this.m1Service.update(updateM1Input.id, updateM1Input);
  }

  @Mutation(() => M1)
  removeM1(@Args('id', { type: () => Int }) id: number) {
    return this.m1Service.remove(id);
  }
}
