import { Test, TestingModule } from '@nestjs/testing';
import { M1Resolver } from './m1.resolver';
import { M1Service } from './m1.service';

describe('M1Resolver', () => {
  let resolver: M1Resolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [M1Resolver, M1Service],
    }).compile();

    resolver = module.get<M1Resolver>(M1Resolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
