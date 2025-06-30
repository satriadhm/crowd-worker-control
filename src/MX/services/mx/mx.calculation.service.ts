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

/**
 * Interface representing a worker's answer to a specific question
 */
interface WorkerAnswer {
  answerId: number; // Unique identifier for the question/answer pair
  answer: string; // The actual answer text chosen by the worker
}

/**
 * Interface for tracking batch processing state per task
 */
interface BatchTracker {
  taskId: string; // Task being tracked
  processedWorkers: Set<string>; // Workers already processed for M-X calculation
  pendingWorkers: string[]; // Workers waiting for batch processing
  lastProcessedBatch: number; // Timestamp of last successful batch processing
}

/**
 * Service responsible for M-X algorithm implementation and batch processing
 *
 * The M-X algorithm calculates worker accuracy in crowdsourcing scenarios by:
 * 1. Using sliding windows of 3 workers to ensure statistical robustness
 * 2. Converting multiple-choice questions to M binary sub-questions (each option as separate binary choice)
 * 3. Applying M-1 algorithm to each sub-question using formula: Qij = Ai·Aj + (1/(M+1))·(1-Ai)·(1-Aj)·(M-1)
 * 4. Calculating comprehensive accuracy using product formula: Ai = ∏(j=1 to M) Aij
 * 5. Averaging results across multiple worker windows
 *
 * Key features:
 * - Requires minimum 3 workers who completed ALL tasks
 * - Uses circular sliding windows for comprehensive analysis
 * - Follows original M-X mathematical formulation with binary conversion
 * - Supports batch processing for efficient eligibility creation
 * - Provides debugging utilities for monitoring batch status
 */

@Injectable()
export class AccuracyCalculationServiceMX {
  // Logger instance for debugging and monitoring M-X calculations
  private readonly logger = new Logger(AccuracyCalculationServiceMX.name);

  // In-memory storage for batch processing trackers per task
  // Key: taskId, Value: BatchTracker containing processing state
  private batchTrackers = new Map<string, BatchTracker>();

  /**
   * Constructor with dependency injection for required services and models
   *
   * @param recordedAnswerModel - MongoDB model for recorded worker answers
   * @param userModel - MongoDB model for user/worker data
   * @param createEligibilityService - Service for creating eligibility records
   * @param getTaskService - Service for retrieving task information
   * @param utilsService - Utility service for batch processing and thresholds
   */
  constructor(
    @InjectModel(RecordedAnswer.name)
    private readonly recordedAnswerModel: Model<RecordedAnswer>,
    @InjectModel(Users.name)
    private readonly userModel: Model<Users>,
    private readonly createEligibilityService: CreateEligibilityService,
    private readonly getTaskService: GetTaskService,
    private readonly utilsService: UtilsService,
  ) {}

  /**
   * Main entry point for processing worker submissions and triggering M-X calculation
   * Flow:
   * 1. Validate that submitting worker has completed all tasks
   * 2. Check if enough workers (≥3) are ready for M-X calculation
   * 3. Either trigger batch processing or set workers to pending status
   * 4. Batch processing creates eligibility records with calculated accuracies
   */
  async processWorkerSubmission(
    taskId: string,
    workerId: string,
  ): Promise<void> {
    this.logger.log(
      `Processing worker submission: taskId=${taskId}, workerId=${workerId}`,
    );

    // Step 1: Get all workers who have completed ALL tasks (prerequisite for M-X)
    const completedWorkers = await this.getCompletedWorkers();
    this.logger.log(
      `Total workers who completed all tasks: ${completedWorkers.length}`,
    );

    // Step 2: Validate the submitting worker has completed all tasks
    const user = await this.userModel.findById(workerId);
    const totalTasks = await this.getTaskService.getTotalTasks();

    // Enhanced logging for debugging
    this.logger.log(
      `Worker ${workerId} - CompletedTasks: ${user?.completedTasks?.length || 0}/${totalTasks}, TotalValidTasks: ${totalTasks}`,
    );

    // Early exit if worker hasn't completed all tasks (M-X requires completion)
    if (!user || (user.completedTasks?.length || 0) < totalTasks) {
      this.logger.debug(
        `Worker ${workerId} has not completed all tasks yet. Skipping M-X processing.`,
      );
      return;
    }

    // Step 3: Initialize or get existing batch tracker for this task
    if (!this.batchTrackers.has(taskId)) {
      this.batchTrackers.set(taskId, {
        taskId,
        processedWorkers: new Set(),
        pendingWorkers: [],
        lastProcessedBatch: 0,
      });
    }

    const tracker = this.batchTrackers.get(taskId);

    // Skip if worker already processed for this task (avoid duplicate processing)
    if (tracker.processedWorkers.has(workerId)) {
      this.logger.debug(
        `Worker ${workerId} already processed for task ${taskId}`,
      );
      return;
    }

    // Step 4: Find completed workers who have submitted answers for this specific task
    const workersWithAnswers = await this.recordedAnswerModel.distinct(
      'workerId',
      {
        taskId,
        workerId: { $in: completedWorkers },
      },
    );

    // Filter out already processed workers
    const eligibleForProcessing = workersWithAnswers.filter(
      (id) => !tracker.processedWorkers.has(id.toString()),
    );

    this.logger.log(
      `Task ${taskId}: ${eligibleForProcessing.length} completed workers with answers eligible for processing`,
    );

    // Step 5: Decision point - batch process or set pending
    if (eligibleForProcessing.length >= 3) {
      // Sufficient workers for M-X calculation - trigger batch processing
      this.logger.log(
        `Processing M-X batch for task ${taskId} with ${eligibleForProcessing.length} completed workers`,
      );
      await this.processBatch(
        taskId,
        tracker,
        eligibleForProcessing.map((id) => id.toString()),
      );
    } else {
      // Not enough workers yet - set as pending until more workers complete
      await this.setPendingStatusForAll(
        eligibleForProcessing.map((id) => id.toString()),
      );
      this.logger.log(
        `Task ${taskId}: Setting ${eligibleForProcessing.length} workers as pending (need ${3 - eligibleForProcessing.length} more for batch processing)`,
      );
    }
  }

  /**
   * Retrieves workers who have completed ALL tasks in the system
   * Flow:
   * 1. Get total number of tasks in system
   * 2. Aggregate workers with role='worker' and count their completed tasks
   * 3. Filter workers who have completedTasksCount >= totalTasks
   * 4. Return array of worker IDs
   */
  private async getCompletedWorkers(): Promise<string[]> {
    try {
      // Step 1: Get the total number of tasks in the system
      const totalTasks = await this.getTaskService.getTotalTasks();

      // Step 2-3: MongoDB aggregation to find workers who completed all tasks
      const completedWorkers = await this.userModel.aggregate([
        { $match: { role: 'worker' } }, // Filter only workers
        {
          $addFields: {
            completedTasksCount: {
              $size: { $ifNull: ['$completedTasks', []] }, // Count completed tasks
            },
          },
        },
        { $match: { completedTasksCount: { $gte: totalTasks } } }, // Filter completed workers
        { $project: { _id: 1 } }, // Return only IDs
      ]);

      // Step 4: Convert to string array for easier handling
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

  /**
   * Sets worker eligibility status to null (pending) when insufficient workers for M-X
   * Flow:
   * 1. Validate input - skip if no workers provided
   * 2. Bulk update all specified workers to set isEligible = null
   * 3. Log the operation for debugging
   */
  private async setPendingStatusForAll(workerIds: string[]): Promise<void> {
    if (workerIds.length === 0) return; // Step 1: Guard clause

    try {
      // Step 2: Bulk update operation to set pending status
      await this.userModel.updateMany(
        { _id: { $in: workerIds } }, // Filter by worker IDs
        { $set: { isEligible: null } }, // Set to pending (null = not yet determined)
      );

      // Step 3: Log for debugging and monitoring
      this.logger.debug(
        `Set ${workerIds.length} workers to pending status: ${workerIds.join(', ')}`,
      );
    } catch (error) {
      this.logger.error('Error setting pending status:', error);
    }
  }

  /**
   * Processes a batch of completed workers for M-X accuracy calculation
   * Flow:
   * 1. Validate task exists and get task details
   * 2. Retrieve all answers from completed workers for this task
   * 3. Ensure minimum 3 workers for M-X calculation
   * 4. Calculate M-X accuracies for all workers
   * 5. Create eligibility records via batch processing or individual fallback
   * 6. Update batch tracker with processed workers
   */
  private async processBatch(
    taskId: string,
    tracker: BatchTracker,
    completedWorkerIds: string[],
  ): Promise<void> {
    this.logger.log(
      `Processing batch for task ${taskId} with ${completedWorkerIds.length} completed workers`,
    );

    // Step 1: Validate task exists and get task configuration
    const task = await this.getTaskService.getTaskById(taskId);
    if (!task) {
      throw new ThrowGQL(
        `Task with ID ${taskId} not found`,
        GQLThrowType.NOT_FOUND,
      );
    }

    // Step 2: Get all recorded answers for this task from completed workers only
    const allAnswers = await this.recordedAnswerModel.find({
      taskId,
      workerId: { $in: completedWorkerIds },
    });

    // Validate we have answer data
    if (allAnswers.length === 0) {
      this.logger.warn(
        `No answers found for task ${taskId} from completed workers`,
      );
      return;
    }

    // Step 3: Extract unique worker IDs and ensure minimum count for M-X
    const allWorkerIds = Array.from(
      new Set(allAnswers.map((a) => a.workerId.toString())),
    );

    if (allWorkerIds.length < 3) {
      this.logger.warn(
        `Insufficient completed workers with answers (${allWorkerIds.length}) for M-X calculation`,
      );
      // Set remaining workers as pending until more workers complete
      await this.setPendingStatusForAll(allWorkerIds);
      return;
    }

    // Step 4: Calculate M-X accuracies for all workers in this batch
    this.logger.log(
      `Calculating M-X accuracy for ${allWorkerIds.length} completed workers`,
    );
    const accuracies = await this.calculateAccuracyMX(taskId, allWorkerIds);

    // Step 5: Prepare data for batch eligibility creation
    const workerSubmissions = allWorkerIds.map((workerId) => ({
      workerId: workerId,
      taskId: taskId,
      accuracy: accuracies[workerId],
    }));

    // Step 5a: Try batch processing via UtilsService (preferred method)
    try {
      const batchResult =
        await this.utilsService.processBatchIsolated(workerSubmissions);

      this.logger.log(
        `Batch processing completed for task ${taskId}. ` +
          `Processed: ${batchResult.processedCount}/${workerSubmissions.length} records. ` +
          `Batch ID: ${batchResult.batchId}, Threshold: ${batchResult.threshold.toFixed(3)}`,
      );
    } catch (error) {
      // Step 5b: Fallback to individual record creation if batch fails
      this.logger.error(
        'Error in batch processing, falling back to individual creation:',
        error,
      );

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

    // Step 6: Update batch tracker to mark workers as processed
    allWorkerIds.forEach((id) => tracker.processedWorkers.add(id));
    tracker.pendingWorkers = tracker.pendingWorkers.filter(
      (id) => !allWorkerIds.includes(id),
    );
    tracker.lastProcessedBatch = Date.now();

    this.logger.log(
      `Batch processing completed for task ${taskId}. Total processed workers: ${tracker.processedWorkers.size}`,
    );
  }

  /**
   * Core M-X algorithm implementation for calculating worker accuracy
   * Flow:
   * 1. Validate task and get M (number of answer choices)
   * 2. Retrieve and organize all worker answers for the task
   * 3. Use circular sliding windows (3 workers per window)
   * 4. Convert multiple-choice to M binary sub-questions (each option as binary choice)
   * 5. Apply M-1 algorithm to each sub-question using: Qij = Ai·Aj + (1/(M+1))·(1-Ai)·(1-Aj)·(M-1)
   * 6. Calculate comprehensive accuracy using product formula: Ai = ∏(j=1 to M) Aij
   * 7. Return final accuracy scores
   */
  async calculateAccuracyMX(
    taskId: string,
    workers: string[],
  ): Promise<Record<string, number>> {
    this.logger.log(`Starting M-X accuracy calculation for taskId: ${taskId}`);

    // Step 1: Validate task exists and get M (number of answer choices)
    const task = await this.getTaskService.getTaskById(taskId);
    if (!task) {
      throw new ThrowGQL(
        `Task with ID ${taskId} not found`,
        GQLThrowType.NOT_FOUND,
      );
    }

    const M = task.nAnswers || 4; // Default to 4 choices if not specified

    // Step 2: Get all recorded answers for this task
    const answers = await this.recordedAnswerModel.find({ taskId });

    // Early exit with default accuracy if insufficient data
    if (answers.length === 0 || workers.length < 3) {
      this.logger.warn(`Insufficient data for M-X calculation`);
      return workers.reduce((acc, workerId) => {
        acc[workerId] = 1 / M; // Random chance accuracy
        return acc;
      }, {});
    }

    // Step 3: Organize answers by worker for efficient access
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

    // Step 4: Get unique answer IDs and sort for consistent processing
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

    // Step 5: Circular sliding windows implementation - each worker appears in multiple windows
    for (let i = 0; i < workers.length; i++) {
      const currentWorkerId = workers[i];
      let workerAccuracy = 0;
      let validWindowCount = 0;

      // Determine number of windows (each worker participates in multiple windows)
      const numWindows = Math.min(workers.length - 2, workers.length);

      // Step 6: For each window containing current worker
      for (let j = 0; j < numWindows; j++) {
        // Create sliding window of 3 workers using circular indexing
        const windowWorkers = [
          workers[(i + j) % workers.length],
          workers[(i + j + 1) % workers.length],
          workers[(i + j + 2) % workers.length],
        ];

        // Validate window has 3 unique workers and includes current worker
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

        // Step 7: Calculate M-X accuracy for this window
        const windowAccuracy = this.calculateMXAccuracyForWindow(
          windowWorkers,
          currentWorkerId,
          workerAnswersMap,
          answerIds,
          M,
        );

        if (windowAccuracy !== null) {
          workerAccuracy += windowAccuracy;
          validWindowCount++;
        }
      }

      // Step 8: Average across windows (simple arithmetic mean for window aggregation)
      if (validWindowCount > 0) {
        finalAccuracies[currentWorkerId] = workerAccuracy / validWindowCount;
      } else {
        // Fallback to random chance if no valid calculations
        finalAccuracies[currentWorkerId] = 1 / M;
      }
    }

    // Step 13: Log final results and return accuracy scores
    this.logger.log(
      `M-X calculation completed. Results: ${JSON.stringify(finalAccuracies)}`,
    );
    return finalAccuracies;
  }

  /**
   * Calculates M-X accuracy for a single worker within a 3-worker window
   * Implements M-X algorithm by:
   * 1. Converting multiple-choice to M binary sub-questions
   * 2. Applying M-1 algorithm to each sub-question
   * 3. Using product formula: Ai = ∏(j=1 to M) Aij
   */
  private calculateMXAccuracyForWindow(
    windowWorkers: string[],
    currentWorkerId: string,
    workerAnswersMap: Record<string, WorkerAnswer[]>,
    answerIds: number[],
    M: number,
  ): number | null {
    const [w1, w2, w3] = windowWorkers;

    // Find position of current worker in window
    const currentWorkerIndex = windowWorkers.indexOf(currentWorkerId);
    if (currentWorkerIndex === -1) return null;

    const optionAccuracies: number[] = [];

    // Step 1: For each answer option (convert to binary sub-questions)
    for (const answerId of answerIds) {
      // Get all possible answer choices for this question from all workers
      const allAnswersForQuestion = windowWorkers
        .map((workerId) =>
          this.getWorkerAnswerForQuestion(workerAnswersMap[workerId], answerId),
        )
        .filter((answer) => answer !== null);

      if (allAnswersForQuestion.length < 3) {
        continue; // Skip if not all workers answered
      }

      // Get unique answer choices for this question
      const uniqueChoices = Array.from(new Set(allAnswersForQuestion));

      // Step 2: Convert each choice to binary sub-question
      for (const choice of uniqueChoices) {
        // Convert to binary: 1 if worker chose this option, 0 otherwise
        const binaryAnswersMap: Record<string, number[]> = {};

        for (const workerId of windowWorkers) {
          const workerAnswer = this.getWorkerAnswerForQuestion(
            workerAnswersMap[workerId],
            answerId,
          );
          // Create binary vector: 1 if chose this option, 0 if chose other option
          binaryAnswersMap[workerId] = [workerAnswer === choice ? 1 : 0];
        }

        // Step 3: Apply M-1 algorithm to this binary sub-question
        const Q12 = this.calculateM1AgreementProbability(
          binaryAnswersMap[w1],
          binaryAnswersMap[w2],
        );
        const Q13 = this.calculateM1AgreementProbability(
          binaryAnswersMap[w1],
          binaryAnswersMap[w3],
        );
        const Q23 = this.calculateM1AgreementProbability(
          binaryAnswersMap[w2],
          binaryAnswersMap[w3],
        );

        // Calculate worker accuracy for this sub-question using M-1
        let subQuestionAccuracy: number;

        if (currentWorkerIndex === 0) {
          // Current worker is w1
          subQuestionAccuracy = this.calculateM1WorkerAccuracy(Q12, Q13);
        } else if (currentWorkerIndex === 1) {
          // Current worker is w2
          subQuestionAccuracy = this.calculateM1WorkerAccuracy(Q12, Q23);
        } else {
          // Current worker is w3
          subQuestionAccuracy = this.calculateM1WorkerAccuracy(Q13, Q23);
        }

        optionAccuracies.push(Math.max(subQuestionAccuracy, 0.01)); // Prevent zeros
      }
    }

    // Step 4: Apply M-X product formula: Ai = ∏(j=1 to M) Aij
    if (optionAccuracies.length === 0) {
      return 1 / M; // Fallback to random chance
    }

    const productAccuracy = optionAccuracies.reduce(
      (product, accuracy) => product * accuracy,
      1,
    );

    return Math.max(1 / M, Math.min(0.95, productAccuracy));
  }

  /**
   * Gets worker's answer for a specific question
   */
  private getWorkerAnswerForQuestion(
    workerAnswers: WorkerAnswer[],
    answerId: number,
  ): string | null {
    const answer = workerAnswers.find((wa) => wa.answerId === answerId);
    return answer ? answer.answer : null;
  }

  /**
   * Calculates agreement probability using M-1 algorithm for binary sub-questions
   * Implements: Qij = Ai·Aj + (1/(M+1))·(1-Ai)·(1-Aj)·(M-1)
   * For binary case, this simplifies to counting agreement in binary vectors
   */
  private calculateM1AgreementProbability(
    worker1BinaryAnswers: number[],
    worker2BinaryAnswers: number[],
  ): number {
    let agreementCount = 0;
    const effectiveN = Math.min(
      worker1BinaryAnswers.length,
      worker2BinaryAnswers.length,
    );

    // Count agreements in binary vectors
    for (let i = 0; i < effectiveN; i++) {
      if (worker1BinaryAnswers[i] === worker2BinaryAnswers[i]) {
        agreementCount++;
      }
    }

    if (effectiveN === 0) {
      return 0.5; // Default when no data available
    }

    // Calculate raw agreement rate
    const rawAgreement = agreementCount / effectiveN;

    // Apply safety bounds for M-1 algorithm stability
    const minAgreement = 0.35;
    const maxAgreement = 0.95;

    return Math.max(minAgreement, Math.min(maxAgreement, rawAgreement));
  }

  /**
   * Calculates individual worker accuracy using M-1 algorithm
   * Simplified approach for binary sub-questions
   */
  private calculateM1WorkerAccuracy(Q12: number, Q13: number): number {
    // For M-1 on binary sub-questions, use average of relevant agreement probabilities
    const avgAgreement = (Q12 + Q13) / 2;

    // Convert agreement to accuracy estimate
    const accuracy = Math.max(0.25, Math.min(0.95, avgAgreement));

    return accuracy;
  }

  /**
   * Resets the batch tracker for a specific task (debugging utility)
   * Flow:
   * 1. Remove the batch tracker from memory
   * 2. Log the reset operation for debugging
   */
  resetBatchTracker(taskId: string): void {
    // Step 1: Delete the tracker from memory
    this.batchTrackers.delete(taskId);
    // Step 2: Log the operation
    this.logger.log(`Reset batch tracker for task ${taskId}`);
  }

  /**
   * Retrieves current batch processing status for a task (debugging utility)
   * Flow:
   * 1. Check if tracker exists for the task
   * 2. Return tracker details or not found message
   */
  getBatchStatus(taskId: string): any {
    // Step 1: Check for existing tracker
    const tracker = this.batchTrackers.get(taskId);
    if (!tracker) {
      return { message: 'No batch tracker found for this task' };
    }

    // Step 2: Return detailed status information
    return {
      taskId: tracker.taskId,
      processedWorkersCount: tracker.processedWorkers.size,
      pendingWorkersCount: tracker.pendingWorkers.length,
      pendingWorkers: tracker.pendingWorkers,
      lastProcessedBatch: new Date(tracker.lastProcessedBatch).toISOString(),
    };
  }

  /**
   * Manual trigger to process M-X algorithm for all tasks with sufficient completed workers
   * Flow:
   * 1. Check if minimum 3 workers have completed ALL tasks
   * 2. Retrieve all tasks in system for processing
   * 3. For each task, check if enough completed workers have submitted answers
   * 4. Process eligible tasks in batches using M-X calculation
   * 5. Track and report processing statistics
   */
  async processAllTasksForCompletedWorkers(): Promise<void> {
    this.logger.log(
      'Checking if M-X algorithm can be triggered for all tasks...',
    );

    // Step 1: Get workers who completed ALL tasks (prerequisite for M-X)
    const completedWorkers = await this.getCompletedWorkers();
    this.logger.log(
      `Workers who completed all tasks: ${completedWorkers.length}`,
    );

    // Early exit if insufficient workers for M-X algorithm
    if (completedWorkers.length < 3) {
      this.logger.log(
        `Not enough completed workers (${completedWorkers.length}/3 minimum). M-X algorithm cannot run yet.`,
      );
      return;
    }

    // Step 2: Get all tasks in the system
    const allTasks = await this.getTaskService.getTasksForMXProcessing();
    this.logger.log(`Total tasks in system: ${allTasks.length}`);

    let processedTaskCount = 0;

    // Step 3-4: Process each task if it has enough completed workers with answers
    for (const task of allTasks) {
      const taskId = task._id.toString();

      this.logger.debug(`Checking task ${taskId} for M-X processing...`);

      // Check if completed workers have submitted answers for this specific task
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

      // Only process if we have minimum 3 workers with answers
      if (workersWithAnswersForTask.length >= 3) {
        // Initialize batch tracker if needed
        if (!this.batchTrackers.has(taskId)) {
          this.batchTrackers.set(taskId, {
            taskId,
            processedWorkers: new Set(),
            pendingWorkers: [],
            lastProcessedBatch: 0,
          });
        }

        const tracker = this.batchTrackers.get(taskId);

        // Get workers not yet processed for this task
        const unprocessedWorkers = workersWithAnswersForTask.filter(
          (id) => !tracker.processedWorkers.has(id.toString()),
        );

        // Process if we have enough unprocessed workers
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

    // Step 5: Report final processing statistics
    this.logger.log(
      `M-X processing completed for ${processedTaskCount}/${allTasks.length} tasks`,
    );
  }
}
