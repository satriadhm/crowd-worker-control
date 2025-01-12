// src/M1/services/m1.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class M1Service {
  async calculateAccuracy(tasks: any[]): Promise<Record<string, number>> {
    const N = tasks.length;
    const workerIds = this.extractWorkerIds(tasks);

    const agreements = this.initializeAgreementCounters(workerIds);

    tasks.forEach((task) => {
      const answers = task.answers.reduce(
        (acc, answer) => {
          acc[answer.workerId] = answer.answer;
          return acc;
        },
        {} as Record<string, string>,
      );

      for (let i = 0; i < workerIds.length; i++) {
        for (let j = i + 1; j < workerIds.length; j++) {
          if (answers[workerIds[i]] === answers[workerIds[j]]) {
            agreements[`${workerIds[i]}_${workerIds[j]}`]++;
          }
        }
      }
    });

    const Qij = this.normalizeAgreements(agreements, N);
    const accuracies = this.solveAccuracies(workerIds, Qij);
    return accuracies;
  }

  async checkEligibility(
    userId: string,
    tasks: any[],
    threshold: number = 0.7,
  ): Promise<{ eligible: boolean; accuracy: number }> {
    const accuracies = await this.calculateAccuracy(tasks);

    // Get the accuracy of the specified user
    const userAccuracy = accuracies[userId];

    // If user not found in accuracies, return ineligible with 0 accuracy
    if (userAccuracy === undefined) {
      return { eligible: false, accuracy: 0 };
    }

    return {
      eligible: userAccuracy >= threshold,
      accuracy: userAccuracy,
    };
  }

  private extractWorkerIds(tasks: any[]): string[] {
    const workerIds = new Set<string>();
    tasks.forEach((task) => {
      task.answers.forEach((answer) => workerIds.add(answer.workerId));
    });
    return Array.from(workerIds);
  }

  private initializeAgreementCounters(
    workerIds: string[],
  ): Record<string, number> {
    const agreements: Record<string, number> = {};
    for (let i = 0; i < workerIds.length; i++) {
      for (let j = i + 1; j < workerIds.length; j++) {
        agreements[`${workerIds[i]}_${workerIds[j]}`] = 0;
      }
    }
    return agreements;
  }

  private normalizeAgreements(
    agreements: Record<string, number>,
    taskCount: number,
  ): Record<string, number> {
    const normalized: Record<string, number> = {};
    Object.keys(agreements).forEach((key) => {
      normalized[key] = agreements[key] / taskCount;
    });
    return normalized;
  }

  private solveAccuracies(
    workerIds: string[],
    Qij: Record<string, number>,
  ): Record<string, number> {
    const M = 2; // Number of possible answers (e.g., A, B)

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

    const solveEquations = (J: number[][], F: number[]): number[] => {
      const size = J.length;
      const A = J.map((row, i) => [...row, F[i]]); // Augmented matrix
      for (let i = 0; i < size; i++) {
        let maxRow = i;
        for (let k = i + 1; k < size; k++) {
          if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) maxRow = k;
        }
        [A[i], A[maxRow]] = [A[maxRow], A[i]];

        const diag = A[i][i];
        for (let j = i; j <= size; j++) A[i][j] /= diag;

        for (let k = 0; k < size; k++) {
          if (k === i) continue;
          const factor = A[k][i];
          for (let j = i; j <= size; j++) A[k][j] -= factor * A[i][j];
        }
      }
      return A.map((row) => row[size]);
    };

    const tolerance = 1e-6;
    const maxIterations = 100;
    let A = new Array(workerIds.length).fill(0.5);
    for (let iteration = 0; iteration < maxIterations; iteration++) {
      const F = equations(A);
      const J = jacobian(A);
      const delta = solveEquations(
        J,
        F.map((f) => -f),
      );
      A = A.map((a, i) => a + delta[i]);

      if (Math.max(...delta.map(Math.abs)) < tolerance) break;
    }

    return workerIds.reduce(
      (acc, id, idx) => {
        acc[id] = A[idx];
        return acc;
      },
      {} as Record<string, number>,
    );
  }
}
