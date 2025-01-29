// src/M1/services/m1.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { GetTaskService } from 'src/tasks/services/get.task.service';
import { Eligibility } from '../models/eligibility';
import { Model } from 'mongoose';
import { RecordedAnswer } from '../models/recorded';

@Injectable()
export class M1Service {
  constructor(
    private readonly getTaskService: GetTaskService,
    @InjectModel(Eligibility.name)
    private readonly eligibilityModel: Model<Eligibility>,
    @InjectModel(RecordedAnswer.name)
    private readonly recordedAnswerModel: Model<RecordedAnswer>,
  ) {}

  /**
   * Assign a task to a worker if not already assigned.
   */
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

  /**
   * Record the worker's answer for a specific task and update accuracy.
   */
  async recordAnswer(
    taskId: string,
    workerId: string,
    answer: string,
  ): Promise<void> {
    await this.eligibilityModel.findOneAndUpdate(
      { taskId, workerId },
      { $set: { answer } },
      { upsert: true, new: true },
    );

    // Record answer in the separate recordedAnswer schema for history
    await this.recordedAnswerModel.create({ taskId, workerId, answer });

    // Fetch all recorded answers for the task
    const answers = await this.recordedAnswerModel.find({ taskId });
    const workers = [...new Set(answers.map((a) => a.workerId.toString()))];

    if (workers.length >= 3) {
      const accuracies = await this.calculateAccuracy(taskId, workers, answers);
      await this.updateEligibility(taskId, accuracies);
    } else {
      console.warn('Insufficient workers for accuracy calculation.');
    }
  }

  /**
   * Calculate accuracy for all workers based on recorded answers.
   */
  private async calculateAccuracy(
    taskId: string,
    workers: string[],
    answers: RecordedAnswer[],
  ): Promise<Record<string, number>> {
    const numWorkers = workers.length;
    const task = await this.getTaskService.getTaskById(taskId);
    const M = task?.answers.length || 0;
    const QijMatrix: number[][] = Array.from({ length: numWorkers }, () =>
      Array(numWorkers).fill(0),
    );

    // Step 1: Compute Qij matrix
    for (let i = 0; i < numWorkers; i++) {
      for (let j = i + 1; j < numWorkers; j++) {
        const workerIAnswers = answers.filter(
          (r) => r.workerId.toString() === workers[i],
        );
        const workerJAnswers = answers.filter(
          (r) => r.workerId.toString() === workers[j],
        );

        let matchingAnswers = 0;
        let totalComparisons = 0;

        workerIAnswers.forEach((answerI) => {
          const answerJ = workerJAnswers.find(
            (a) => a.taskId.toString() === answerI.taskId.toString(),
          );
          if (answerJ) {
            totalComparisons++;
            if (answerI.answer === answerJ.answer) {
              matchingAnswers++;
            }
          }
        });

        const Qij =
          totalComparisons > 0 ? matchingAnswers / totalComparisons : 0;
        QijMatrix[i][j] = Qij;
        QijMatrix[j][i] = Qij; // Symmetric matrix
      }
    }

    // Step 2: Solve linear system for accuracy scores
    const A = this.solveLinearSystem(QijMatrix, numWorkers, M);

    // Step 3: Map results to worker IDs
    const accuracyMap: Record<string, number> = {};
    workers.forEach((workerId, index) => {
      accuracyMap[workerId] = A[index];
    });

    return accuracyMap;
  }

  /**
   * Solve the linear system to calculate accuracy scores.
   */
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

  /**
   * Update eligibility based on calculated accuracy scores.
   */
  private async updateEligibility(
    taskId: string,
    accuracies: Record<string, number>,
    threshold = 0.7,
  ): Promise<void> {
    const updates = Object.entries(accuracies).map(([workerId, accuracy]) => ({
      updateOne: {
        filter: { taskId, workerId },
        update: { $set: { accuracy, eligible: accuracy >= threshold } },
      },
    }));

    if (updates.length > 0) {
      await this.eligibilityModel.bulkWrite(updates);
    }
  }

  /**
   * Get a list of eligible workers for a specific task.
   */
  async getEligibleWorkers(taskId: string): Promise<string[]> {
    const eligibleWorkers = await this.eligibilityModel.find({
      taskId,
      eligible: true,
    });
    return eligibleWorkers.map((worker) => worker.workerId.toString());
  }
}
