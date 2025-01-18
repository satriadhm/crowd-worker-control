// src/M1/services/m1.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { GetTaskService } from 'src/tasks/services/get.task.service';
import { Eligibility } from '../models/eligibility';
import { Model } from 'mongoose';

@Injectable()
export class M1Service {
  constructor(
    private getTaskService: GetTaskService,
    @InjectModel(Eligibility.name)
    private readonly eligibilityModel: Model<Eligibility>,
  ) {}

  async assignTaskToWorker(taskId: string, workerId: string): Promise<void> {
    const task = await this.getTaskService.getTaskById(taskId);
    if (!task) throw new Error('Task not found');

    const existingAssignment = await this.eligibilityModel.findOne({
      taskId,
      workerId,
    });
    if (!existingAssignment) {
      await this.eligibilityModel.create({
        taskId,
        workerId,
        answer: '',
        eligible: false,
      });
    }
  }

  async recordAnswer(
    taskId: string,
    workerId: string,
    answer: string,
  ): Promise<void> {
    const workerTask = await this.eligibilityModel.findOne({
      taskId,
      workerId,
    });
    if (!workerTask) throw new Error('Worker not assigned to this task');

    workerTask.answer = answer;
    await workerTask.save();

    const answers = await this.eligibilityModel.find({ taskId });
    if (answers.length === 3) {
      const workers = answers.map((a) => a.workerId);
      const workerAccuracies = this.calculateAccuracy(taskId, answers);
      await this.updateEligibility(taskId, workers, workerAccuracies);
    }
  }

  private calculateAccuracy(
    taskId: string,
    answers: Eligibility[],
  ): Record<string, number> {
    const N = answers.length; // Number of problems
    const workers = answers.map((a) => a.workerId);
    const Qij: Record<string, number> = {};
    const agreements: Record<string, number> = {};

    workers.forEach((w1, i) => {
      workers.slice(i + 1).forEach((w2) => {
        agreements[`${w1}_${w2}`] = 0;
      });
    });

    answers.forEach((answer) => {
      const taskAnswers = answer.answers.reduce(
        (acc, a) => ({ ...acc, [a.workerId]: a.answer }),
        {},
      );

      workers.forEach((w1, i) => {
        workers.slice(i + 1).forEach((w2) => {
          if (taskAnswers[w1] === taskAnswers[w2]) {
            agreements[`${w1}_${w2}`]++;
          }
        });
      });
    });

    Object.keys(agreements).forEach((key) => {
      Qij[key] = agreements[key] / N;
    });

    const accuracies = this.calculateMajorityAdjustedAccuracy(
      workers,
      answers,
      Qij,
    );
    return accuracies;
  }

  /**
   * Updates the eligibility of workers based on their accuracy.
   */
  private async updateEligibility(
    taskId: string,
    workers: string[],
    accuracies: Record<string, number>,
    threshold = 0.7,
  ): Promise<void> {
    for (const workerId of workers) {
      const workerTask = await this.eligibilityModel.findOne({
        taskId,
        workerId,
      });
      if (workerTask) {
        workerTask.accuracy = accuracies[workerId];
        workerTask.eligible = accuracies[workerId] >= threshold;
        await workerTask.save();
      }
    }
  }

  /**
   * Solves a linear system using Gaussian elimination.
   */
  private solveLinearSystem(J: number[][], F: number[]): number[] {
    const size = J.length;
    const augmentedMatrix = J.map((row, i) => [...row, F[i]]);

    for (let i = 0; i < size; i++) {
      let maxRow = i;
      for (let k = i + 1; k < size; k++) {
        if (
          Math.abs(augmentedMatrix[k][i]) > Math.abs(augmentedMatrix[maxRow][i])
        ) {
          maxRow = k;
        }
      }

      [augmentedMatrix[i], augmentedMatrix[maxRow]] = [
        augmentedMatrix[maxRow],
        augmentedMatrix[i],
      ];
      const diag = augmentedMatrix[i][i];
      for (let j = i; j <= size; j++) {
        augmentedMatrix[i][j] /= diag;
      }

      for (let k = i + 1; k < size; k++) {
        const factor = augmentedMatrix[k][i];
        for (let j = i; j <= size; j++) {
          augmentedMatrix[k][j] -= factor * augmentedMatrix[i][j];
        }
      }
    }

    const solution = new Array(size).fill(0);
    for (let i = size - 1; i >= 0; i--) {
      solution[i] = augmentedMatrix[i][size];
      for (let j = i + 1; j < size; j++) {
        solution[i] -= augmentedMatrix[i][j] * solution[j];
      }
    }

    return solution;
  }

  /**
   * Adjusts accuracy dynamically based on majority agreement.
   */
  private calculateMajorityAdjustedAccuracy(
    workerIds: string[],
    answers: Eligibility[],
    Qij: Record<string, number>,
  ): Record<string, number> {
    const M = 2;
    const equations = (A: number[]) =>
      workerIds.flatMap((_, i) =>
        workerIds.slice(i + 1).map((_, j) => {
          const key = `${workerIds[i]}_${workerIds[i + 1 + j]}`;
          return (
            Qij[key] -
            (A[i] * A[i + 1 + j] + ((1 - A[i]) * (1 - A[i + 1 + j])) / (M - 1))
          );
        }),
      );

    const jacobian = (A: number[]) => {
      const J: number[][] = [];
      workerIds.forEach((_, i) => {
        workerIds.slice(i + 1).forEach((_, j) => {
          const row = new Array(workerIds.length).fill(0);
          row[i] = A[i + 1 + j] - (1 - A[i + 1 + j]) / (M - 1);
          row[i + 1 + j] = A[i] - (1 - A[i]) / (M - 1);
          J.push(row);
        });
      });
      return J;
    };

    const tolerance = 1e-6;
    const maxIterations = 100;
    let A = new Array(workerIds.length).fill(0.5);

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      const F = equations(A);
      const J = jacobian(A);
      const delta = this.solveLinearSystem(
        J,
        F.map((f) => -f),
      );
      A = A.map((a, i) => a + delta[i]);

      if (Math.max(...delta.map(Math.abs)) < tolerance) break;
    }

    const majorityAccuracies: Record<string, number> = {};
    const majorityThreshold = 2 / 3;

    workerIds.forEach((workerId, idx) => {
      const agreeCount = workerIds.reduce((count, otherId) => {
        if (workerId !== otherId) {
          const key = `${workerId}_${otherId}`;
          if (Qij[key] > majorityThreshold) count++;
        }
        return count;
      }, 0);

      majorityAccuracies[workerId] =
        A[idx] * (agreeCount / (workerIds.length - 1));
    });

    return majorityAccuracies;
  }
}
