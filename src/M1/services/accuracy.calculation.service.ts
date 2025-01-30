// src/M1/services/accuracy-calculation.service.ts
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
    @InjectModel(Task.name) private readonly taskModel: Model<Task>,
  ) {}

  async calculateAccuracy(
    taskId: string,
    workers: string[],
  ): Promise<Record<string, number>> {
    const task = await this.taskModel.findById(taskId);
    if (!task) throw new Error('Task not found');

    const answers = await this.recordedAnswerModel.find({ taskId });
    const N = task.answers.length;

    // Step 1: Calculate Qij matrix
    const QijMatrix: number[][] = Array.from({ length: workers.length }, () =>
      Array(workers.length).fill(0),
    );

    for (let i = 0; i < workers.length; i++) {
      for (let j = i + 1; j < workers.length; j++) {
        let Tij = 0;
        for (let k = 0; k < N; k++) {
          const answerI = answers.find(
            (a) =>
              a.workerId.toString() === workers[i] &&
              a.taskId.toString() === taskId,
          );
          const answerJ = answers.find(
            (a) =>
              a.workerId.toString() === workers[j] &&
              a.taskId.toString() === taskId,
          );
          if (answerI && answerJ && answerI.answer === answerJ.answer) {
            Tij++;
          }
        }
        const Qij = Tij / N;
        QijMatrix[i][j] = Qij;
        QijMatrix[j][i] = Qij; // Symmetric matrix
      }
    }

    // Step 2: Solve the system of equations for accuracy scores
    const A = this.solveLinearSystem(QijMatrix, workers.length, N);

    // Step 3: Map results to worker IDs
    const accuracyMap: Record<string, number> = {};
    workers.forEach((workerId, index) => {
      accuracyMap[workerId] = A[index];
    });

    return accuracyMap;
  }

  private solveLinearSystem(
    QijMatrix: number[][],
    numWorkers: number,
    M: number,
  ): number[] {
    const A = Array(numWorkers).fill(0.5); // Initial guesses for accuracy
    const tolerance = 0.0001; // Convergence threshold
    let maxIterations = 1000;

    while (maxIterations > 0) {
      maxIterations--;
      const newA = [...A];

      for (let i = 0; i < numWorkers; i++) {
        let numerator = 0;
        let denominator = 0;

        for (let j = 0; j < numWorkers; j++) {
          if (i === j) continue;

          const Qij = QijMatrix[i][j];
          numerator += Qij * (A[j] - 1 / (M + 1));
          denominator += A[j] - 1 / (M + 1);
        }

        newA[i] = numerator / (denominator || 1); // Avoid division by zero
      }

      // Check for convergence
      if (newA.every((val, idx) => Math.abs(val - A[idx]) < tolerance)) {
        break;
      }

      A.splice(0, A.length, ...newA); // Update A with new values
    }

    return A;
  }
}
