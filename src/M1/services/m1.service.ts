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
    if (!workerTask) {
      // Jika pekerja baru, tambahkan ke database
      await this.eligibilityModel.create({
        taskId,
        workerId,
        answer,
        eligible: false,
      });
    } else {
      // Perbarui jawaban pekerja yang sudah ada
      workerTask.answer = answer;
      await workerTask.save();
    }

    // Ambil semua jawaban terkini untuk taskId
    const answers = await this.eligibilityModel.find({ taskId });
    const workers = answers.map((a) => a.workerId);

    const accuracies = this.calculateAccuracy(workers, answers);
    await this.updateEligibility(taskId, workers, accuracies);
  }

  private calculateAccuracy(
    workerIds: string[],
    answers: Eligibility[],
  ): Record<string, number> {
    const N = answers.length;
    const Qij: Record<string, number> = {};

    for (let i = 0; i < workerIds.length; i++) {
      for (let j = i + 1; j < workerIds.length; j++) {
        const w1 = workerIds[i];
        const w2 = workerIds[j];

        let agreementCount = 0;
        for (const answer of answers) {
          if (
            answer.answer === answers.find((a) => a.workerId === w2)?.answer
          ) {
            agreementCount++;
          }
        }

        Qij[`${w1}_${w2}`] = agreementCount / N;
      }
    }

    return this.solveAccuracyEquations(workerIds, Qij);
  }

  private solveAccuracyEquations(
    workerIds: string[],
    Qij: Record<string, number>,
    M = 2,
  ): Record<string, number> {
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

    return workerIds.reduce(
      (acc, workerId, idx) => {
        acc[workerId] = A[idx];
        return acc;
      },
      {} as Record<string, number>,
    );
  }

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

  async getEligibleWorkers(taskId: string): Promise<string[]> {
    const eligibleWorkers = await this.eligibilityModel.find({
      taskId,
      eligible: true,
    });
    return eligibleWorkers.map((worker) => worker.workerId);
  }
}
