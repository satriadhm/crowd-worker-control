import { Test, TestingModule } from '@nestjs/testing';
import { EvaluationResolver } from './evaluation.resolver';
import { EvaluationService } from './evaluation.service';

describe('EvaluationResolver', () => {
  let resolver: EvaluationResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EvaluationResolver, EvaluationService],
    }).compile();

    resolver = module.get<EvaluationResolver>(EvaluationResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
