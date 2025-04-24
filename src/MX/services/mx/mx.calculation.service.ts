import { Injectable, Logger } from '@nestjs/common';
import { GetTaskService } from '../../../tasks/services/get.task.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RecordedAnswer } from '../../models/recorded';
import { GQLThrowType, ThrowGQL } from '@app/gqlerr';
import { Cron } from '@nestjs/schedule';
import { CronExpression } from 'src/lib/cron.enum';
import { CreateEligibilityService } from '../eligibility/create.eligibility.service';
import { CreateEligibilityInput } from '../../dto/eligibility/inputs/create.eligibility.input';
import { Users } from 'src/users/models/user';

interface WorkerAnswer {
  answerId: number;
  answer: string;
}

@Injectable()
export class AccuracyCalculationServiceMX {
  private readonly logger = new Logger(AccuracyCalculationServiceMX.name);

  constructor(
    @InjectModel(RecordedAnswer.name)
    private readonly recordedAnswerModel: Model<RecordedAnswer>,
    @InjectModel(Users.name)
    private readonly userModel: Model<Users>,
    private readonly createEligibilityService: CreateEligibilityService,
    private readonly getTaskService: GetTaskService,
  ) {}

  /**
   * Calculate accuracy for each worker using the M-X algorithm with sliding window approach
   */
  async calculateAccuracyMX(
    taskId: string,
    workers: string[],
  ): Promise<Record<string, number>> {
    this.logger.log(`Starting M-X accuracy calculation for taskId: ${taskId}`);

    // Step 1: Get task data
    const task = await this.getTaskService.getTaskById(taskId);
    if (!task) {
      this.logger.error(`Task with ID ${taskId} not found`);
      throw new ThrowGQL(
        `Task with ID ${taskId} not found`,
        GQLThrowType.NOT_FOUND,
      );
    }

    const N = task.answers.length; // Number of questions
    const M = task.nAnswers || 4; // Number of answer options per question

    this.logger.log(`Task found, questions: ${N}, answer options: ${M}`);

    // Get recorded answers for the task
    const answers = await this.recordedAnswerModel.find({ taskId });

    if (answers.length === 0) {
      this.logger.warn(`No recorded answers found for taskId: ${taskId}`);
      return workers.reduce((acc, workerId) => {
        acc[workerId] = 0.5; // Default accuracy when no data available
        return acc;
      }, {});
    }

    // Final accuracies for each worker
    const finalAccuracies: Record<string, number> = {};
    workers.forEach((workerId) => {
      finalAccuracies[workerId] = 1.0; // Initial value for product
    });

    // Map to store worker answers with answerId and answer text
    const workerAnswersMap: Record<string, WorkerAnswer[]> = {};

    for (const workerId of workers) {
      const workerRecords = answers.filter(
        (a) => a.workerId.toString() === workerId,
      );

      // Store both answerId and answer text
      workerAnswersMap[workerId] = workerRecords.map((record) => ({
        answerId: record.answerId,
        answer: record.answer,
      }));
    }

    // If we have less than 3 workers, we can't apply the M-X algorithm properly
    if (workers.length < 3) {
      this.logger.warn(
        `Not enough workers (${workers.length}) for proper M-X algorithm calculation. Minimum 3 required.`,
      );
      return workers.reduce((acc, workerId) => {
        acc[workerId] = 0.5; // Default when not enough workers
        return acc;
      }, {});
    }

    // Implement sliding window approach as described in the M-X algorithm
    // Arrange workers in a circular pattern for sliding window
    const circularWorkers = [...workers];

    // For each worker, calculate accuracy using sliding windows of 3 workers
    for (let i = 0; i < workers.length; i++) {
      const currentWorkerId = workers[i];
      const accuracies = [];

      // Use sliding window of 3 workers
      for (let j = 0; j < workers.length; j++) {
        // Get the three workers in current sliding window
        const windowWorkers = [
          circularWorkers[(i + j) % workers.length],
          circularWorkers[(i + j + 1) % workers.length],
          circularWorkers[(i + j + 2) % workers.length],
        ];

        // Check if workers are unique in this window (avoid duplicate workers)
        const uniqueWorkers = new Set(windowWorkers);
        if (uniqueWorkers.size < 3) continue;

        // Skip if the current worker isn't in this window
        if (!windowWorkers.includes(currentWorkerId)) continue;

        // Process each answer option as a separate binary problem
        const answerIds = Array.from(
          new Set(answers.map((a) => a.answerId)),
        ).sort((a, b) => a - b);

        const optionsToProcess =
          answerIds.length > 0
            ? answerIds
            : Array.from({ length: M }, (_, i) => i);

        // For each option, calculate worker accuracies
        const optionAccuracies = [];

        for (const answerId of optionsToProcess) {
          // Create binary vectors for each worker based on this answer option
          const binaryAnswersMap: Record<string, number[]> = {};

          for (const wId of windowWorkers) {
            const workerAnswers = workerAnswersMap[wId] || [];

            binaryAnswersMap[wId] = workerAnswers.map((wa) =>
              wa.answerId === answerId ? 1 : 0,
            );
          }

          // Extract the three workers in this window
          const w1 = windowWorkers[0];
          const w2 = windowWorkers[1];
          const w3 = windowWorkers[2];

          // Calculate agreement probabilities between worker pairs
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

          // Calculate accuracy for the current worker based on their position in the window
          let workerAccuracy;

          if (currentWorkerId === w1) {
            workerAccuracy = this.calculateWorkerAccuracy(Q12, Q13, Q23, M);
          } else if (currentWorkerId === w2) {
            workerAccuracy = this.calculateWorkerAccuracy(Q12, Q23, Q13, M);
          } else if (currentWorkerId === w3) {
            workerAccuracy = this.calculateWorkerAccuracy(Q13, Q23, Q12, M);
          }

          if (workerAccuracy !== undefined) {
            optionAccuracies.push(workerAccuracy);
          }
        }

        // Calculate average accuracy across all options for this window
        if (optionAccuracies.length > 0) {
          const avgAccuracy =
            optionAccuracies.reduce((sum, val) => sum + val, 0) /
            optionAccuracies.length;
          accuracies.push(avgAccuracy);
        }
      }

      // Calculate final accuracy as average across all windows
      if (accuracies.length > 0) {
        const avgAccuracy =
          accuracies.reduce((sum, val) => sum + val, 0) / accuracies.length;

        // Apply scaling to better differentiate worker performance
        const scaledAccuracy = 0.4 + avgAccuracy * 0.6;

        finalAccuracies[currentWorkerId] = parseFloat(
          scaledAccuracy.toFixed(2),
        );
      } else {
        finalAccuracies[currentWorkerId] = 0.5; // Default when not enough data
      }
    }

    this.logger.log(
      `M-X calculation completed. Final accuracies: ${JSON.stringify(finalAccuracies)}`,
    );
    return finalAccuracies;
  }

  /**
   * Calculate agreement probability between two workers' binary answer vectors
   */
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

  /**
   * Calculate worker accuracy using the M-X algorithm formula (Equation 3 in the paper)
   */
  private calculateWorkerAccuracy(
    Q12: number,
    Q13: number,
    Q23: number,
    M: number,
  ): number {
    try {
      // Implementation of Equation 3 from the paper
      const term1 = 1 / M;
      const term2 = (M - 1) / M;

      // Avoid division by zero or negative square roots
      if (M * Q23 - 1 <= 0 || (M * Q12 - 1) * (M * Q13 - 1) < 0) {
        return 0.5; // Default value for invalid calculations
      }

      const sqrtTerm = Math.sqrt(
        ((M * Q12 - 1) * (M * Q13 - 1)) / (M * Q23 - 1),
      );

      let accuracy = term1 + term2 * sqrtTerm;

      // Bound accuracy to reasonable values
      accuracy = Math.max(0.1, Math.min(0.95, accuracy));

      return accuracy;
    } catch (error) {
      this.logger.error(`Error calculating worker accuracy: ${error.message}`);
      return 0.5; // Default on error
    }
  }

  /**
   * Calculate eligibility for all workers based on their accuracy
   */
  @Cron(CronExpression.EVERY_HOUR)
  async calculateEligibility() {
    try {
      this.logger.log('Running eligibility calculation');

      const allWorkerIds = await this.userModel
        .find({ role: 'worker' })
        .distinct('_id')
        .exec();

      if (allWorkerIds.length === 0) {
        this.logger.warn('No workers available for eligibility calculation');
        return;
      }

      const workerIds = allWorkerIds.map((id) => id.toString());
      this.logger.log(`Processing ${workerIds.length} workers`);

      const tasks = await this.getTaskService.getValidatedTasks();
      if (!tasks || tasks.length === 0) {
        this.logger.warn('No validated tasks found');
        return;
      }

      for (const task of tasks) {
        const recordedAnswers = await this.recordedAnswerModel.find({
          taskId: task.id,
          workerId: { $in: workerIds },
        });

        const taskWorkerIds = Array.from(
          new Set(recordedAnswers.map((answer) => answer.workerId.toString())),
        );

        if (taskWorkerIds.length < 3) {
          this.logger.debug(
            `Skipping task ${task.id} - needs at least 3 workers (only has ${taskWorkerIds.length})`,
          );
          continue;
        }

        const accuracies = await this.calculateAccuracyMX(
          task.id,
          taskWorkerIds,
        );

        for (const workerId of taskWorkerIds) {
          const accuracy = accuracies[workerId];
          const eligibilityInput: CreateEligibilityInput = {
            taskId: task.id,
            workerId: workerId,
            accuracy: accuracy,
          };

          await this.createEligibilityService.createEligibility(
            eligibilityInput,
          );
          this.logger.debug(
            `Created eligibility record for worker ${workerId}: ${accuracy}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(`Error in calculateEligibility: ${error.message}`);
    }
  }
}
