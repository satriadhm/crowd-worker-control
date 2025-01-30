// src/M1/services/accuracy-calculation.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Task } from 'src/tasks/models/task';
import { RecordedAnswer } from './models/recorded';
import { AccuracyCalculationService } from './services/accuracy.calculation.service';

describe('AccuracyCalculationService', () => {
  let service: AccuracyCalculationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccuracyCalculationService,
        {
          provide: getModelToken(RecordedAnswer.name),
          useValue: {
            find: jest.fn().mockResolvedValue([
              { taskId: 'task1', workerId: 'worker1', answer: 'A' },
              { taskId: 'task1', workerId: 'worker2', answer: 'A' },
              { taskId: 'task1', workerId: 'worker3', answer: 'B' },
            ]),
          },
        },
        {
          provide: getModelToken(Task.name),
          useValue: {
            findById: jest.fn().mockResolvedValue({
              _id: 'task1',
              answers: ['A', 'B', 'C'],
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AccuracyCalculationService>(
      AccuracyCalculationService,
    );
  });

  it('should calculate accuracy correctly', async () => {
    const taskId = 'task1';
    const workers = ['worker1', 'worker2', 'worker3'];
    const accuracies = await service.calculateAccuracy(taskId, workers);

    expect(accuracies['worker1']).toBeCloseTo(0.75);
    expect(accuracies['worker2']).toBeCloseTo(0.75);
    expect(accuracies['worker3']).toBeCloseTo(0.5);
  });
});
