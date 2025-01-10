import { Module } from '@nestjs/common';
import { M1Service } from './services/m1.service';
import { M1Resolver } from './m1.resolver';

@Module({
  providers: [M1Resolver, M1Service],
})
export class M1Module {}
