import { GetTaskService } from './../../tasks/services/get.task.service';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RecordedAnswer } from '../models/recorded';
import { Task } from 'src/tasks/models/task';

@Injectable()
export class AccuracyCalculationService {
  constructor(
    @InjectModel(RecordedAnswer.name)
    private readonly recordedAnswerModel: Model<RecordedAnswer>,
    @InjectModel(Task.name)
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
    M: number,
  ): Promise<Record<string, number>> {
    // Fetch the task. We assume that task.answers is an array of the correct answers or metadata.
    const task = await this.getTaskService.getTaskById(taskId);

    // Number of problems in this task.
    const N = task.answers.length;

    // Fetch all recorded answers for this task.
    // We assume that each RecordedAnswer now includes a property `questionIndex` (0-based index).
    const answers = await this.recordedAnswerModel.find({ taskId });

    // Create a 2D array for Qij between each pair of workers.
    const numWorkers = workers.length;
    const QijMatrix: number[][] = Array.from({ length: numWorkers }, () =>
      Array(numWorkers).fill(0),
    );

    // For every pair (i, j), compare answers for each problem index k.
    for (let i = 0; i < numWorkers; i++) {
      for (let j = i + 1; j < numWorkers; j++) {
        let Tij = 0;
        // For each problem k, find the answer provided by worker i and j.
        for (let k = 0; k < N; k++) {
          const answerI = answers.find(
            (a) =>
              a.workerId.toString() === workers[i] &&
              a.taskId.toString() === taskId &&
              a['questionIndex'] === k, // ensure each answer is associated with a question index
          );
          const answerJ = answers.find(
            (a) =>
              a.workerId.toString() === workers[j] &&
              a.taskId.toString() === taskId &&
              a['questionIndex'] === k,
          );
          if (answerI && answerJ && answerI.answer === answerJ.answer) {
            Tij++;
          }
        }
        const Qij = Tij / N;
        QijMatrix[i][j] = Qij;
        QijMatrix[j][i] = Qij; // symmetric
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

      // Check for convergence
      let maxDiff = 0;
      for (let i = 0; i < numWorkers; i++) {
        maxDiff = Math.max(maxDiff, Math.abs(newA[i] - A[i]));
      }
      A = newA;
      if (maxDiff < tolerance) break;
    }

    // Map results back to worker IDs
    const accuracyMap: Record<string, number> = {};
    workers.forEach((workerId, index) => {
      accuracyMap[workerId] = A[index];
    });
    return accuracyMap;
  }
}
