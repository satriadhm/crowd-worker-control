// src/MX/services/mx/mx.calculation.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { GetTaskService } from '../../../tasks/services/get.task.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RecordedAnswer } from '../../models/recorded';
import { GQLThrowType, ThrowGQL } from '@app/gqlerr';
import { CreateEligibilityService } from '../eligibility/create.eligibility.service';
import { CreateEligibilityInput } from '../../dto/eligibility/inputs/create.eligibility.input';
import { Users } from 'src/users/models/user';
import { UtilsService } from '../utils/utils.service';

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
    private readonly utilsService: UtilsService,
  ) {}

  async processWorkerSubmission(
    taskId: string,
    workerId: string,
  ): Promise<void> {
    this.logger.log(
      `Processing worker submission: taskId=${taskId}, workerId=${workerId}`,
    );

    // Get all workers who have completed ALL tasks
    const completedWorkers = await this.getCompletedWorkers();
    this.logger.log(
      `Total workers who completed all tasks: ${completedWorkers.length}`,
    );

    // Check if the submitting worker has completed all tasks
    const user = await this.userModel.findById(workerId);
    const totalTasks = await this.getTaskService.getTotalTasks();

    // Enhanced logging for debugging
    this.logger.log(
      `Worker ${workerId} - CompletedTasks: ${user?.completedTasks?.length || 0}/${totalTasks}, TotalValidTasks: ${totalTasks}`,
    );

    if (!user || (user.completedTasks?.length || 0) < totalTasks) {
      this.logger.debug(
        `Worker ${workerId} has not completed all tasks yet. Skipping M-X processing.`,
      );
      return;
    }

    // Initialize tracker if needed
    if (!this.batchTrackers.has(taskId)) {
      this.batchTrackers.set(taskId, {
        taskId,
        processedWorkers: new Set(),
        pendingWorkers: [],
        lastProcessedBatch: 0,
      });
    }

    const tracker = this.batchTrackers.get(taskId);

    // Skip if worker already processed for this task
    if (tracker.processedWorkers.has(workerId)) {
      this.logger.debug(
        `Worker ${workerId} already processed for task ${taskId}`,
      );
      return;
    }

    // Get all completed workers who have answers for this task
    const workersWithAnswers = await this.recordedAnswerModel.distinct(
      'workerId',
      {
        taskId,
        workerId: { $in: completedWorkers },
      },
    );

    const eligibleForProcessing = workersWithAnswers.filter(
      (id) => !tracker.processedWorkers.has(id.toString()),
    );

    this.logger.log(
      `Task ${taskId}: ${eligibleForProcessing.length} completed workers with answers eligible for processing`,
    );

    // Process batch if we have enough completed workers with answers
    if (eligibleForProcessing.length >= 3) {
      this.logger.log(
        `Processing M-X batch for task ${taskId} with ${eligibleForProcessing.length} completed workers`,
      );
      await this.processBatch(
        taskId,
        tracker,
        eligibleForProcessing.map((id) => id.toString()),
      );
    } else {
      // Set eligible workers as pending (not enough for batch processing yet)
      await this.setPendingStatusForAll(
        eligibleForProcessing.map((id) => id.toString()),
      );
      this.logger.log(
        `Task ${taskId}: Setting ${eligibleForProcessing.length} workers as pending (need ${3 - eligibleForProcessing.length} more for batch processing)`,
      );
    }
  }

  private async getCompletedWorkers(): Promise<string[]> {
    try {
      const totalTasks = await this.getTaskService.getTotalTasks();

      const completedWorkers = await this.userModel.aggregate([
        { $match: { role: 'worker' } },
        {
          $addFields: {
            completedTasksCount: {
              $size: { $ifNull: ['$completedTasks', []] },
            },
          },
        },
        { $match: { completedTasksCount: { $gte: totalTasks } } },
        { $project: { _id: 1 } },
      ]);

      const workerIds = completedWorkers.map((w) => w._id.toString());
      this.logger.debug(
        `Found ${workerIds.length} workers who completed all ${totalTasks} tasks`,
      );

      return workerIds;
    } catch (error) {
      this.logger.error('Error getting completed workers:', error);
      return [];
    }
  }

  private async setPendingStatusForAll(workerIds: string[]): Promise<void> {
    if (workerIds.length === 0) return;

    try {
      await this.userModel.updateMany(
        { _id: { $in: workerIds } },
        { $set: { isEligible: null } },
      );

      this.logger.debug(
        `Set ${workerIds.length} workers to pending status: ${workerIds.join(', ')}`,
      );
    } catch (error) {
      this.logger.error('Error setting pending status:', error);
    }
  }

  private async processBatch(
    taskId: string,
    tracker: BatchTracker,
    completedWorkerIds: string[],
  ): Promise<void> {
    this.logger.log(
      `Processing batch for task ${taskId} with ${completedWorkerIds.length} completed workers`,
    );

    const task = await this.getTaskService.getTaskById(taskId);
    if (!task) {
      throw new ThrowGQL(
        `Task with ID ${taskId} not found`,
        GQLThrowType.NOT_FOUND,
      );
    }

    // Get all answers for this task from completed workers only
    const allAnswers = await this.recordedAnswerModel.find({
      taskId,
      workerId: { $in: completedWorkerIds },
    });

    if (allAnswers.length === 0) {
      this.logger.warn(
        `No answers found for task ${taskId} from completed workers`,
      );
      return;
    }

    // Get unique worker IDs from answers (should all be completed workers)
    const allWorkerIds = Array.from(
      new Set(allAnswers.map((a) => a.workerId.toString())),
    );

    if (allWorkerIds.length < 3) {
      this.logger.warn(
        `Insufficient completed workers with answers (${allWorkerIds.length}) for M-X calculation`,
      );
      // Set remaining workers as pending
      await this.setPendingStatusForAll(allWorkerIds);
      return;
    }

    this.logger.log(
      `Calculating M-X accuracy for ${allWorkerIds.length} completed workers`,
    );
    const accuracies = await this.calculateAccuracyMX(taskId, allWorkerIds);

    // Prepare worker submissions for batch processing
    const workerSubmissions = allWorkerIds.map((workerId) => ({
      workerId: workerId,
      taskId: taskId,
      accuracy: accuracies[workerId],
    }));

    // Use isolated batch processing from UtilsService
    try {
      const batchResult =
        await this.utilsService.processBatchIsolated(workerSubmissions);

      this.logger.log(
        `Batch processing completed for task ${taskId}. ` +
          `Processed: ${batchResult.processedCount}/${workerSubmissions.length} records. ` +
          `Batch ID: ${batchResult.batchId}, Threshold: ${batchResult.threshold.toFixed(3)}`,
      );
    } catch (error) {
      this.logger.error(
        'Error in batch processing, falling back to individual creation:',
        error,
      );

      // Fallback to individual creation if batch processing fails
      for (const workerId of allWorkerIds) {
        try {
          const accuracy = accuracies[workerId];
          const eligibilityInput: CreateEligibilityInput = {
            taskId: taskId,
            workerId: workerId,
            accuracy: accuracy,
          };

          await this.createEligibilityService.createEligibility(
            eligibilityInput,
          );
          this.logger.debug(
            `Created/updated eligibility for worker ${workerId}: accuracy=${accuracy.toFixed(3)}`,
          );
        } catch (individualError) {
          this.logger.error(
            `Error creating eligibility for worker ${workerId}:`,
            individualError,
          );
        }
      }
    }

    // Mark all workers as processed
    allWorkerIds.forEach((id) => tracker.processedWorkers.add(id));
    tracker.pendingWorkers = tracker.pendingWorkers.filter(
      (id) => !allWorkerIds.includes(id),
    );
    tracker.lastProcessedBatch = Date.now();

    this.logger.log(
      `Batch processing completed for task ${taskId}. Total processed workers: ${tracker.processedWorkers.size}`,
    );
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

    // Circular sliding windows implementation
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

          this.logger.debug(
            `Agreement probabilities for window ${j}: Q12=${Q12.toFixed(3)}, Q13=${Q13.toFixed(3)}, Q23=${Q23.toFixed(3)}, M=${M}`,
          );

          let workerAccuracy: number | undefined;

          if (currentWorkerId === w1) {
            workerAccuracy = this.calculateWorkerAccuracy(Q12, Q13, Q23, M);
          } else if (currentWorkerId === w2) {
            workerAccuracy = this.calculateWorkerAccuracy(Q12, Q23, Q13, M);
          } else if (currentWorkerId === w3) {
            workerAccuracy = this.calculateWorkerAccuracy(Q13, Q23, Q12, M);
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

    if (effectiveN === 0) {
      return 0.5; // Default when no data
    }

    const rawAgreement = agreementCount / effectiveN;

    // Apply minimum threshold to prevent mathematical issues in M-X formula
    // Ensure Q >= 1/M + small epsilon to avoid negative denominators
    const minAgreement = 0.35; // Minimum agreement probability
    const maxAgreement = 0.95; // Maximum to avoid perfect agreement edge cases

    return Math.max(minAgreement, Math.min(maxAgreement, rawAgreement));
  }

  private calculateWorkerAccuracy(
    Q12: number,
    Q13: number,
    Q23: number,
    M: number,
  ): number {
    try {
      // Validate input probabilities
      if ([Q12, Q13, Q23].some((q) => q < 0 || q > 1 || isNaN(q))) {
        this.logger.debug(
          `Invalid agreement probabilities: Q12=${Q12}, Q13=${Q13}, Q23=${Q23}`,
        );
        return 1 / M;
      }

      // Ensure minimum values to prevent mathematical issues
      const minQ = 1 / M + 0.01; // Minimum to ensure positive denominator
      const safeQ12 = Math.max(minQ, Q12);
      const safeQ13 = Math.max(minQ, Q13);
      const safeQ23 = Math.max(minQ, Q23);

      const term1 = 1 / M;
      const term2 = (M - 1) / M;

      const denominator = M * safeQ23 - 1;
      const numeratorProduct = (M * safeQ12 - 1) * (M * safeQ13 - 1);

      if (denominator <= 0) {
        this.logger.debug(
          `Invalid denominator after safety: ${denominator}, Q23=${safeQ23}, M=${M}`,
        );
        return 1 / M;
      }

      if (numeratorProduct < 0) {
        this.logger.debug(
          `Invalid numerator product: ${numeratorProduct}, Q12=${safeQ12}, Q13=${safeQ13}`,
        );
        return 1 / M;
      }

      const sqrtTerm = Math.sqrt(numeratorProduct / denominator);
      let accuracy = term1 + term2 * sqrtTerm;

      // Clamp accuracy to valid range
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

  async processAllTasksForCompletedWorkers(): Promise<void> {
    this.logger.log(
      'Checking if M-X algorithm can be triggered for all tasks...',
    );

    const completedWorkers = await this.getCompletedWorkers();
    this.logger.log(
      `Workers who completed all tasks: ${completedWorkers.length}`,
    );

    if (completedWorkers.length < 3) {
      this.logger.log(
        `Not enough completed workers (${completedWorkers.length}/3 minimum). M-X algorithm cannot run yet.`,
      );
      return;
    }

    // Get all tasks
    const allTasks = await this.getTaskService.getTasksForMXProcessing();
    this.logger.log(`Total tasks in system: ${allTasks.length}`);

    let processedTaskCount = 0;

    // Process each task if it has enough completed workers with answers
    for (const task of allTasks) {
      const taskId = task._id.toString();

      this.logger.debug(`Checking task ${taskId} for M-X processing...`);

      // Check if workers have answers for this specific task
      const workersWithAnswersForTask = await this.recordedAnswerModel.distinct(
        'workerId',
        {
          taskId,
          workerId: { $in: completedWorkers },
        },
      );

      this.logger.debug(
        `Task ${taskId}: ${workersWithAnswersForTask.length} completed workers have answers`,
      );

      if (workersWithAnswersForTask.length >= 3) {
        // Initialize tracker if needed
        if (!this.batchTrackers.has(taskId)) {
          this.batchTrackers.set(taskId, {
            taskId,
            processedWorkers: new Set(),
            pendingWorkers: [],
            lastProcessedBatch: 0,
          });
        }

        const tracker = this.batchTrackers.get(taskId);

        // Get unprocessed workers for this task
        const unprocessedWorkers = workersWithAnswersForTask.filter(
          (id) => !tracker.processedWorkers.has(id.toString()),
        );

        if (unprocessedWorkers.length >= 3) {
          this.logger.log(
            `Processing M-X batch for task ${taskId} with ${unprocessedWorkers.length} completed workers`,
          );

          await this.processBatch(
            taskId,
            tracker,
            unprocessedWorkers.map((id) => id.toString()),
          );
          processedTaskCount++;
        }
      }
    }

    this.logger.log(
      `M-X processing completed for ${processedTaskCount}/${allTasks.length} tasks`,
    );
  }
}
