import { Injectable, Logger } from '@nestjs/common';
import { GetTaskService } from '../../../tasks/services/get.task.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RecordedAnswer } from '../../models/recorded';
import { GQLThrowType, ThrowGQL } from '@app/gqlerr';
import { CreateEligibilityService } from '../eligibility/create.eligibility.service';
import { CreateEligibilityInput } from '../../dto/eligibility/inputs/create.eligibility.input';
import { Users } from 'src/users/models/user';

interface WorkerAnswer {
  answerId: number;
  answer: string;
}

interface BatchTracker {
  taskId: string;
  processedWorkers: Set<string>;
  pendingWorkers: string[];
  lastProcessedBatch: number;
}

@Injectable()
export class AccuracyCalculationServiceMX {
  private readonly logger = new Logger(AccuracyCalculationServiceMX.name);
  private batchTrackers = new Map<string, BatchTracker>();

  constructor(
    @InjectModel(RecordedAnswer.name)
    private readonly recordedAnswerModel: Model<RecordedAnswer>,
    @InjectModel(Users.name)
    private readonly userModel: Model<Users>,
    private readonly createEligibilityService: CreateEligibilityService,
    private readonly getTaskService: GetTaskService,
  ) {}

  async processWorkerSubmission(
    taskId: string,
    workerId: string,
  ): Promise<void> {
    this.logger.log(
      `Processing worker submission: taskId=${taskId}, workerId=${workerId}`,
    );

    if (!this.batchTrackers.has(taskId)) {
      this.batchTrackers.set(taskId, {
        taskId,
        processedWorkers: new Set(),
        pendingWorkers: [],
        lastProcessedBatch: 0,
      });
    }

    const tracker = this.batchTrackers.get(taskId);

    if (tracker.processedWorkers.has(workerId)) {
      this.logger.debug(
        `Worker ${workerId} already processed for task ${taskId}`,
      );
      return;
    }

    tracker.pendingWorkers.push(workerId);
    this.logger.log(
      `Added worker ${workerId} to pending batch. Pending count: ${tracker.pendingWorkers.length}`,
    );

    if (tracker.pendingWorkers.length >= 3) {
      await this.processBatch(taskId, tracker);
    } else {
      await this.setPendingStatus(tracker.pendingWorkers);
      this.logger.log(
        `Workers in task ${taskId} are pending (need ${3 - tracker.pendingWorkers.length} more workers)`,
      );
    }
  }

  private async processBatch(
    taskId: string,
    tracker: BatchTracker,
  ): Promise<void> {
    this.logger.log(
      `Processing batch for task ${taskId} with ${tracker.pendingWorkers.length} workers`,
    );

    const task = await this.getTaskService.getTaskById(taskId);
    if (!task) {
      throw new ThrowGQL(
        `Task with ID ${taskId} not found`,
        GQLThrowType.NOT_FOUND,
      );
    }

    const allAnswers = await this.recordedAnswerModel.find({ taskId });
    const allWorkerIds = Array.from(
      new Set(allAnswers.map((a) => a.workerId.toString())),
    );

    if (allWorkerIds.length < 3) {
      this.logger.warn(
        `Insufficient total workers (${allWorkerIds.length}) for M-X calculation`,
      );
      return;
    }

    const accuracies = await this.calculateAccuracyMX(taskId, allWorkerIds);

    for (const workerId of allWorkerIds) {
      const accuracy = accuracies[workerId];
      const eligibilityInput: CreateEligibilityInput = {
        taskId: taskId,
        workerId: workerId,
        accuracy: accuracy,
      };

      await this.createEligibilityService.createEligibility(eligibilityInput);
      this.logger.debug(
        `Created/updated eligibility for worker ${workerId}: accuracy=${accuracy.toFixed(3)}`,
      );
    }

    allWorkerIds.forEach((id) => tracker.processedWorkers.add(id));
    tracker.pendingWorkers = [];
    tracker.lastProcessedBatch = Date.now();

    this.logger.log(
      `Batch processing completed for task ${taskId}. Total processed workers: ${tracker.processedWorkers.size}`,
    );
  }

  private async setPendingStatus(workerIds: string[]): Promise<void> {
    for (const workerId of workerIds) {
      await this.userModel.findByIdAndUpdate(workerId, {
        $set: { isEligible: null },
      });
      this.logger.debug(`Set worker ${workerId} to pending status`);
    }
  }

  async calculateAccuracyMX(
    taskId: string,
    workers: string[],
  ): Promise<Record<string, number>> {
    this.logger.log(`Starting M-X accuracy calculation for taskId: ${taskId}`);

    const task = await this.getTaskService.getTaskById(taskId);
    if (!task) {
      throw new ThrowGQL(
        `Task with ID ${taskId} not found`,
        GQLThrowType.NOT_FOUND,
      );
    }

    const M = task.nAnswers || 4;

    const answers = await this.recordedAnswerModel.find({ taskId });

    if (answers.length === 0 || workers.length < 3) {
      this.logger.warn(`Insufficient data for M-X calculation`);
      return workers.reduce((acc, workerId) => {
        acc[workerId] = 1 / M;
        return acc;
      }, {});
    }

    const workerAnswersMap: Record<string, WorkerAnswer[]> = {};
    for (const workerId of workers) {
      const workerRecords = answers.filter(
        (a) => a.workerId.toString() === workerId,
      );
      workerAnswersMap[workerId] = workerRecords.map((record) => ({
        answerId: record.answerId,
        answer: record.answer,
      }));
    }

    const finalAccuracies: Record<string, number> = {};

    const answerIds = Array.from(new Set(answers.map((a) => a.answerId))).sort(
      (a, b) => a - b,
    );

    if (answerIds.length === 0) {
      this.logger.warn('No answer IDs found');
      return workers.reduce((acc, workerId) => {
        acc[workerId] = 1 / M;
        return acc;
      }, {});
    }

    for (let i = 0; i < workers.length; i++) {
      const currentWorkerId = workers[i];
      const workerAccuraciesAcrossWindows: number[] = [];

      const numWindows = Math.min(workers.length - 2, workers.length);

      for (let j = 0; j < numWindows; j++) {
        const windowWorkers = [
          workers[(i + j) % workers.length],
          workers[(i + j + 1) % workers.length],
          workers[(i + j + 2) % workers.length],
        ];

        const uniqueWorkers = new Set(windowWorkers);
        if (
          uniqueWorkers.size < 3 ||
          !windowWorkers.includes(currentWorkerId)
        ) {
          continue;
        }

        this.logger.debug(
          `Window ${j} for worker ${currentWorkerId}: [${windowWorkers.join(', ')}]`,
        );

        const optionAccuracies: number[] = [];

        for (const answerId of answerIds) {
          const binaryAnswersMap: Record<string, number[]> = {};

          for (const wId of windowWorkers) {
            const workerAnswers = workerAnswersMap[wId] || [];
            binaryAnswersMap[wId] = workerAnswers.map((wa) =>
              wa.answerId === answerId ? 1 : 0,
            );
          }

          const [w1, w2, w3] = windowWorkers;

          const Q12 = this.calculateAgreementProbability(
            binaryAnswersMap[w1],
            binaryAnswersMap[w2],
          );
          const Q13 = this.calculateAgreementProbability(
            binaryAnswersMap[w1],
            binaryAnswersMap[w3],
          );
          const Q23 = this.calculateAgreementProbability(
            binaryAnswersMap[w2],
            binaryAnswersMap[w3],
          );

          let workerAccuracy: number | undefined;

          if (currentWorkerId === w1) {
            workerAccuracy = this.calculateWorkerAccuracy(Q12, Q13, Q23, 2);
          } else if (currentWorkerId === w2) {
            workerAccuracy = this.calculateWorkerAccuracy(Q12, Q23, Q13, 2);
          } else if (currentWorkerId === w3) {
            workerAccuracy = this.calculateWorkerAccuracy(Q13, Q23, Q12, 2);
          }

          if (workerAccuracy !== undefined && !isNaN(workerAccuracy)) {
            optionAccuracies.push(workerAccuracy);
          }
        }

        if (optionAccuracies.length > 0) {
          const geometricMean = Math.pow(
            optionAccuracies.reduce(
              (product, val) => product * Math.max(val, 0.01),
              1,
            ),
            1 / optionAccuracies.length,
          );
          workerAccuraciesAcrossWindows.push(geometricMean);
        }
      }

      if (workerAccuraciesAcrossWindows.length > 0) {
        const finalAccuracy =
          workerAccuraciesAcrossWindows.reduce((sum, val) => sum + val, 0) /
          workerAccuraciesAcrossWindows.length;

        finalAccuracies[currentWorkerId] = Math.max(
          1 / M,
          Math.min(0.95, finalAccuracy),
        );
      } else {
        finalAccuracies[currentWorkerId] = 1 / M;
      }
    }

    this.logger.log(
      `M-X calculation completed. Results: ${JSON.stringify(finalAccuracies)}`,
    );
    return finalAccuracies;
  }

  private calculateAgreementProbability(
    worker1Answers: number[],
    worker2Answers: number[],
  ): number {
    let agreementCount = 0;
    const effectiveN = Math.min(worker1Answers.length, worker2Answers.length);

    for (let i = 0; i < effectiveN; i++) {
      if (worker1Answers[i] === worker2Answers[i]) {
        agreementCount++;
      }
    }

    return effectiveN > 0 ? agreementCount / effectiveN : 0.5;
  }

  private calculateWorkerAccuracy(
    Q12: number,
    Q13: number,
    Q23: number,
    M: number,
  ): number {
    try {
      if ([Q12, Q13, Q23].some((q) => q < 0 || q > 1 || isNaN(q))) {
        this.logger.debug(
          `Invalid agreement probabilities: Q12=${Q12}, Q13=${Q13}, Q23=${Q23}`,
        );
        return 1 / M;
      }

      const term1 = 1 / M;
      const term2 = (M - 1) / M;

      const denominator = M * Q23 - 1;
      const numeratorProduct = (M * Q12 - 1) * (M * Q13 - 1);

      if (denominator <= 0) {
        this.logger.debug(`Invalid denominator: ${denominator}`);
        return 1 / M;
      }

      if (numeratorProduct < 0) {
        this.logger.debug(`Invalid numerator product: ${numeratorProduct}`);
        return 1 / M;
      }

      const sqrtTerm = Math.sqrt(numeratorProduct / denominator);
      let accuracy = term1 + term2 * sqrtTerm;

      accuracy = Math.max(0.0, Math.min(1.0, accuracy));

      if (isNaN(accuracy) || !isFinite(accuracy)) {
        this.logger.debug(`Invalid accuracy result: ${accuracy}`);
        return 1 / M;
      }

      return accuracy;
    } catch (error) {
      this.logger.error(`Error in calculateWorkerAccuracy: ${error.message}`);
      return 1 / M;
    }
  }

  resetBatchTracker(taskId: string): void {
    this.batchTrackers.delete(taskId);
    this.logger.log(`Reset batch tracker for task ${taskId}`);
  }

  getBatchStatus(taskId: string): any {
    const tracker = this.batchTrackers.get(taskId);
    if (!tracker) {
      return { message: 'No batch tracker found for this task' };
    }

    return {
      taskId: tracker.taskId,
      processedWorkersCount: tracker.processedWorkers.size,
      pendingWorkersCount: tracker.pendingWorkers.length,
      pendingWorkers: tracker.pendingWorkers,
      lastProcessedBatch: new Date(tracker.lastProcessedBatch).toISOString(),
    };
  }
}
