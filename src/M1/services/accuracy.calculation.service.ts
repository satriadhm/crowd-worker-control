import { GetTaskService } from './../../tasks/services/get.task.service';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RecordedAnswer } from '../models/recorded';
import { GQLThrowType, ThrowGQL } from '@app/gqlerr';
import { EligibilityUpdateService } from './eligibility/update.eligibility.service';
import { Cron } from '@nestjs/schedule';
import { CronExpression } from 'src/lib/cron.enum';

@Injectable()
export class AccuracyCalculationService {
  constructor(
    @InjectModel(RecordedAnswer.name)
    private readonly recordedAnswerModel: Model<RecordedAnswer>,
    private readonly eligibilityUpdateService: EligibilityUpdateService,
    private readonly getTaskService: GetTaskService,
  ) {}

  /**
   * Calculates the accuracy rates for the provided workers for a given task.
   * @param taskId The task identifier.
   * @param workers Array of worker IDs.
   * @param M Number of multiple-choice options per problem.
   * @returns A mapping from workerId to its estimated accuracy.
   */
  async calculateAccuracy(
    taskId: string,
    workers: string[],
    windowSize: number,
    M: number,
  ): Promise<Record<string, number>> {
    const task = await this.getTaskService.getTaskById(taskId);
    if (!task) {
      throw new ThrowGQL(
        `Task with ID ${taskId} not found`,
        GQLThrowType.NOT_FOUND,
      );
    }
    const N = task.answers.length;
    const answers = await this.recordedAnswerModel.find({ taskId });
    const numWorkers = workers.length;

    // Initialize a 2D array to store Qij values.
    const QijMatrix: number[][] = Array.from({ length: numWorkers }, () =>
      Array(numWorkers).fill(0),
    );

    // For every pair (i, j), compare answers for each problem index k.
    for (let start = 0; start <= numWorkers - windowSize; start++) {
      const subsetWorkers = workers.slice(start, start + windowSize);

      for (let i = 0; i < subsetWorkers.length; i++) {
        for (let j = i + 1; j < subsetWorkers.length; j++) {
          let Tij = 0;

          // Bandingkan jawaban pekerja dalam subset
          for (let k = 0; k < N; k++) {
            const answerI = answers.find(
              (a) =>
                a.workerId.toString() === subsetWorkers[i] &&
                a.taskId.toString() === taskId &&
                a['questionIndex'] === k,
            );
            const answerJ = answers.find(
              (a) =>
                a.workerId.toString() === subsetWorkers[j] &&
                a.taskId.toString() === taskId &&
                a['questionIndex'] === k,
            );
            if (answerI && answerJ && answerI.answer === answerJ.answer) {
              Tij++;
            }
          }

          const Qij = Tij / N;
          const indexI = workers.indexOf(subsetWorkers[i]);
          const indexJ = workers.indexOf(subsetWorkers[j]);

          QijMatrix[indexI][indexJ] = Qij;
          QijMatrix[indexJ][indexI] = Qij; // Matriks simetris
        }
      }
    }

    // Use an iterative fixed-point method to solve for accuracies A_i.
    const accuracies = this.solveForAccuracies(QijMatrix, workers, M);
    return accuracies;
  }

  /**
   * Iteratively solves for the worker accuracies given a Qij matrix.
   * We use the equation for each pair (i, j):
   *
   *     Qij = Ai * Aj + ((1 - Ai)*(1 - Aj))/(M - 1)
   *
   * and rearrange for Ai given A_j:
   *
   *     Ai = [ (M - 1) * Qij + A_j - 1 ] / (M * A_j - 1 )
   *
   * For each worker i, we average the estimates from all other workers j.
   *
   * @param QijMatrix 2D array of Qij values.
   * @param workers Array of worker IDs.
   * @param M Number of multiple-choice options.
   * @returns Array of accuracies corresponding to the workers.
   */

  private solveForAccuracies(
    QijMatrix: number[][],
    workers: string[],
    M: number,
  ): Record<string, number> {
    const numWorkers = workers.length;
    let A = Array(numWorkers).fill(0.5); // initial guess for accuracies
    const tolerance = 0.0001;
    let maxIterations = 1000;
    const epsilon = 1e-6; // to avoid division by zero

    while (maxIterations > 0) {
      maxIterations--;
      const newA = new Array(numWorkers).fill(0);

      for (let i = 0; i < numWorkers; i++) {
        let sumEstimates = 0;
        let count = 0;
        // For each j ≠ i, derive an estimate for A_i from the equation
        for (let j = 0; j < numWorkers; j++) {
          if (i === j) continue;
          const Qij = QijMatrix[i][j];
          // Avoid division by a value that might be too small.
          if (Math.abs(M * A[j] - 1) < epsilon) continue;
          const estimate = ((M - 1) * Qij + A[j] - 1) / (M * A[j] - 1);
          sumEstimates += estimate;
          count++;
        }
        // If for some reason count is 0 (should not happen), keep the old value.
        newA[i] = count > 0 ? sumEstimates / count : A[i];
      }
      let maxDiff = 0;
      for (let i = 0; i < numWorkers; i++) {
        maxDiff = Math.max(maxDiff, Math.abs(newA[i] - A[i]));
      }
      A = newA;
      if (maxDiff < tolerance) break;
    }

    const accuracyMap: Record<string, number> = {};
    workers.forEach((workerId, index) => {
      accuracyMap[workerId] = A[index];
    });
    return accuracyMap;
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  async calculateEligibility() {
    const tasks = await this.getTaskService.getTasks();
    if (!tasks) throw new Error('Task not found');
    for (const task of tasks) {
      const recordedAnswers = await this.recordedAnswerModel.find({
        taskId: task.id,
      });
      const workerIds = Array.from(
        new Set(recordedAnswers.map((answer) => answer.workerId.toString())),
      );
      if (workerIds.length === 0) continue;
      const m = task.answers.length;
      const accuracies = await this.calculateAccuracy(task.id, workerIds, m, 3);
      await this.eligibilityUpdateService.updateEligibility(
        task.id,
        accuracies,
      );
    }
  }
}
