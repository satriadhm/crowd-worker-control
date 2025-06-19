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

    const M = task.nAnswers || 4; // Number of answer options per question

    const answers = await this.recordedAnswerModel.find({ taskId });

    if (answers.length === 0 || workers.length < 3) {
      this.logger.warn(`Insufficient data for M-X calculation`);
      return workers.reduce((acc, workerId) => {
        acc[workerId] = 1 / M; // Theoretical minimum accuracy
        return acc;
      }, {});
    }

    // Map worker answers
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

    // Get all unique answer IDs for decomposition
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

    // For each worker, calculate accuracy using sliding windows
    for (let i = 0; i < workers.length; i++) {
      const currentWorkerId = workers[i];
      const workerAccuraciesAcrossWindows: number[] = [];

      // Sliding window approach - generate all possible 3-worker combinations
      for (let j = 0; j < workers.length - 2; j++) {
        const windowWorkers = [
          workers[(i + j) % workers.length],
          workers[(i + j + 1) % workers.length],
          workers[(i + j + 2) % workers.length],
        ];

        // Ensure unique workers and current worker is in window
        const uniqueWorkers = new Set(windowWorkers);
        if (
          uniqueWorkers.size < 3 ||
          !windowWorkers.includes(currentWorkerId)
        ) {
          continue;
        }

        // Calculate accuracy for each option dimension (M-X extension for multiple choice)
        const optionAccuracies: number[] = [];

        for (const answerId of answerIds) {
          // Create binary vectors for this answer option
          const binaryAnswersMap: Record<string, number[]> = {};

          for (const wId of windowWorkers) {
            const workerAnswers = workerAnswersMap[wId] || [];
            binaryAnswersMap[wId] = workerAnswers.map((wa) =>
              wa.answerId === answerId ? 1 : 0,
            );
          }

          const [w1, w2, w3] = windowWorkers;

          // Calculate pairwise agreement probabilities
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

          // Calculate accuracy for current worker based on position in window
          let workerAccuracy: number | undefined;

          if (currentWorkerId === w1) {
            workerAccuracy = this.calculateWorkerAccuracy(Q12, Q13, Q23, 2); // Binary M=2
          } else if (currentWorkerId === w2) {
            workerAccuracy = this.calculateWorkerAccuracy(Q12, Q23, Q13, 2);
          } else if (currentWorkerId === w3) {
            workerAccuracy = this.calculateWorkerAccuracy(Q13, Q23, Q12, 2);
          }

          if (workerAccuracy !== undefined && !isNaN(workerAccuracy)) {
            optionAccuracies.push(workerAccuracy);
          }
        }

        // For multiple-choice problems, combine option accuracies
        // According to paper: A_i = ∏(j=1 to M) A_ij
        if (optionAccuracies.length > 0) {
          // Use geometric mean instead of product to avoid extremely small values
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

      // Final accuracy: average across all windows
      if (workerAccuraciesAcrossWindows.length > 0) {
        const finalAccuracy =
          workerAccuraciesAcrossWindows.reduce((sum, val) => sum + val, 0) /
          workerAccuraciesAcrossWindows.length;

        // Ensure reasonable bounds without arbitrary scaling
        finalAccuracies[currentWorkerId] = Math.max(
          1 / M, // Theoretical minimum (random guessing)
          Math.min(0.95, finalAccuracy), // Practical maximum
        );
      } else {
        finalAccuracies[currentWorkerId] = 1 / M; // Default to random guessing probability
      }
    }

    this.logger.log(
      `M-X calculation completed. Results: ${JSON.stringify(finalAccuracies)}`,
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
   * Calculate worker accuracy using the M-X algorithm formula
   */
  private calculateWorkerAccuracy(
    Q12: number,
    Q13: number,
    Q23: number,
    M: number,
  ): number {
    try {
      // Validate input ranges
      if ([Q12, Q13, Q23].some((q) => q < 0 || q > 1 || isNaN(q))) {
        this.logger.debug(
          `Invalid agreement probabilities: Q12=${Q12}, Q13=${Q13}, Q23=${Q23}`,
        );
        return 1 / M;
      }

      // M-X Algorithm formula implementation
      const term1 = 1 / M;
      const term2 = (M - 1) / M;

      // Check mathematical validity before square root
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
