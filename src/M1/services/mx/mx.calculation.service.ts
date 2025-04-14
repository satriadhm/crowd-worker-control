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
    private readonly createEligibilityService: CreateEligibilityService,
    private readonly getTaskService: GetTaskService,
  ) {}

  /**
   * Menghitung accuracy tiap worker menggunakan algoritma M-X.
   * Algoritma ini memecah M opsi jawaban menjadi M sub-masalah biner dan menghitung
   * akurasi untuk setiap opsi, kemudian menggabungkannya dengan perkalian.
   */
  async calculateAccuracyMX(
    taskId: string,
    workers: string[],
  ): Promise<Record<string, number>> {
    this.logger.log(`Memulai perhitungan akurasi M-X untuk taskId: ${taskId}`);

    // Step 1: Get task data
    const task = await this.getTaskService.getTaskById(taskId);
    if (!task) {
      this.logger.error(`Task dengan ID ${taskId} tidak ditemukan`);
      throw new ThrowGQL(
        `Task dengan ID ${taskId} tidak ditemukan`,
        GQLThrowType.NOT_FOUND,
      );
    }

    const N = task.answers.length; // Jumlah soal
    const M = task.nAnswers || 4; // Jumlah opsi jawaban per soal

    this.logger.log(`Task ditemukan, jumlah soal: ${N}, opsi jawaban: ${M}`);

    // Get recorded answers for the task
    const answers = await this.recordedAnswerModel.find({ taskId });

    if (answers.length === 0) {
      this.logger.warn(`No recorded answers found for taskId: ${taskId}`);
      return workers.reduce((acc, workerId) => {
        acc[workerId] = 0.5; // Default accuracy when no data available
        return acc;
      }, {});
    }

    // Hasil akhir akurasi tiap worker
    const finalAccuracies: Record<string, number> = {};
    workers.forEach((workerId) => {
      finalAccuracies[workerId] = 1.0; // Initial value for product
    });

    // Map untuk menyimpan jawaban worker dengan answerId dan answer text
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

      // Debug log to verify data
      this.logger.debug(
        `Worker ${workerId} answers: ${JSON.stringify(workerAnswersMap[workerId])}`,
      );
    }

    // Step 2-9: Process each answer option separately
    // For each possible answerId, create a binary problem
    const answerIds = Array.from(new Set(answers.map((a) => a.answerId))).sort(
      (a, b) => a - b,
    );

    this.logger.debug(`Processing answer options: ${answerIds.join(', ')}`);

    const optionsToProcess =
      answerIds.length > 0 ? answerIds : Array.from({ length: M }, (_, i) => i);

    for (const answerId of optionsToProcess) {
      this.logger.debug(`Processing answer option ID: ${answerId}`);

      const binaryAnswersMap: Record<string, number[]> = {};

      for (const workerId of workers) {
        const workerAnswers = workerAnswersMap[workerId] || [];

        binaryAnswersMap[workerId] = workerAnswers.map((wa) =>
          wa.answerId === answerId ? 1 : 0,
        );

        this.logger.debug(
          `Worker ${workerId} binary for answer ${answerId}: ${binaryAnswersMap[workerId].join(',')}`,
        );
      }

      // Calculate accuracy for this option using fixed-point method
      const optionAccuracies = await this.calculateBinaryOptionAccuracy(
        taskId,
        workers,
        binaryAnswersMap,
      );

      // Accumulate accuracies with multiplication per M-X algorithm
      for (const workerId of workers) {
        // Avoid multiplying by extremely small values that would zero out everything
        const optionAccuracy = Math.max(0.1, optionAccuracies[workerId]);
        finalAccuracies[workerId] *= optionAccuracy;

        this.logger.debug(
          `Worker ${workerId} option ${answerId} accuracy: ${optionAccuracies[workerId]}, cumulative: ${finalAccuracies[workerId]}`,
        );
      }
    }

    // Normalize results to avoid extremely low values due to multiplication
    // and format the final results
    for (const workerId of workers) {
      // Apply root to normalize the product
      const normalizedAccuracy = Math.pow(
        finalAccuracies[workerId],
        1 / optionsToProcess.length,
      );

      // Apply scaling to avoid all workers getting the same low accuracy
      // This helps differentiate worker performance better
      const scaledAccuracy = 0.4 + normalizedAccuracy * 0.6;

      finalAccuracies[workerId] = parseFloat(scaledAccuracy.toFixed(2));
    }

    this.logger.log(
      `Perhitungan selesai. Akurasi M-X akhir: ${JSON.stringify(finalAccuracies)}`,
    );
    return finalAccuracies;
  }

  /**
   * Menghitung akurasi untuk masalah biner (satu opsi) menggunakan metode fixed-point
   * dengan pendekatan yang serupa dengan algoritma 2 (yang tersirat dari kode asli).
   */
  private async calculateBinaryOptionAccuracy(
    taskId: string,
    workers: string[],
    binaryAnswersMap: Record<string, number[]>,
  ): Promise<Record<string, number>> {
    // Estimasi awal akurasi
    let accuracies: Record<string, number> = {};
    workers.forEach((workerId) => {
      accuracies[workerId] = 0.5;
    });

    // Parameter iterasi
    const maxIterations = 100;
    const tolerance = 0.0001;
    let iterations = 0;
    let converged = false;

    // Iterasi fixed-point
    while (!converged && iterations < maxIterations) {
      iterations++;
      const newAccuracies: Record<string, number> = {};

      for (const i of workers) {
        // Untuk setiap worker i, estimasi akurasinya menggunakan semua worker lainnya (j)
        const estimates: number[] = [];

        for (const j of workers) {
          if (i === j) continue; // Skip diri sendiri

          // Hitung nilai Q (tingkat kesamaan jawaban) antara worker i dan j
          let agreementCount = 0;
          for (
            let k = 0;
            k <
            Math.min(binaryAnswersMap[i].length, binaryAnswersMap[j].length);
            k++
          ) {
            if (binaryAnswersMap[i][k] === binaryAnswersMap[j][k]) {
              agreementCount++;
            }
          }

          // Use actual array length for normalization
          const effectiveN = Math.min(
            binaryAnswersMap[i].length,
            binaryAnswersMap[j].length,
          );
          const Qij = effectiveN > 0 ? agreementCount / effectiveN : 0.5;

          // Rumus dari algoritma 2 yang dimodifikasi untuk kasus biner
          const Aj = accuracies[j];
          const numerator = 2 * Qij - 1 + (1 - Aj);
          const denominator = 2 * Aj - 1;

          // Hindari pembagian dengan nol dan extreme values
          if (Math.abs(denominator) > 0.01) {
            const estimate = numerator / denominator;
            // Add reasonable bounds to avoid extreme estimates
            if (estimate >= 0 && estimate <= 1) {
              estimates.push(estimate);
            }
          }
        }

        // Rata-ratakan estimasi dan batasi ke [0,1]
        if (estimates.length > 0) {
          const avg =
            estimates.reduce((sum, val) => sum + val, 0) / estimates.length;
          newAccuracies[i] = Math.max(0.1, Math.min(0.95, avg));
        } else {
          // If no valid estimates, keep current accuracy with slight randomization
          // to break symmetry
          const randomAdjustment = Math.random() * 0.1 - 0.05;
          newAccuracies[i] = Math.max(
            0.1,
            Math.min(0.9, accuracies[i] + randomAdjustment),
          );
        }
      }

      // Cek konvergensi
      converged = true;
      for (const workerId of workers) {
        if (
          Math.abs(newAccuracies[workerId] - accuracies[workerId]) > tolerance
        ) {
          converged = false;
          break;
        }
      }

      // Update nilai akurasi untuk iterasi berikutnya
      accuracies = { ...newAccuracies };
    }

    // Format hasil
    const result: Record<string, number> = {};
    for (const workerId of workers) {
      result[workerId] = parseFloat(accuracies[workerId].toFixed(2));
    }

    return result;
  }

  /**
   * Method calculateEligibility melakukan perhitungan accuracy untuk tiap task,
   * kemudian menentukan status eligible untuk masing-masing worker berdasarkan threshold.
   */
  @Cron(CronExpression.EVERY_MINUTE) // Change from EVERY_5_SECONDS to less frequent
  async calculateEligibility() {
    const tasks = await this.getTaskService.getValidatedTasks();
    if (!tasks) {
      this.logger.warn('No validated tasks found');
      return;
    }

    for (const task of tasks) {
      const recordedAnswers = await this.recordedAnswerModel.find({
        taskId: task.id,
      });

      const workerIds = Array.from(
        new Set(recordedAnswers.map((answer) => answer.workerId.toString())),
      );

      if (workerIds.length < 3) {
        this.logger.debug(
          `Skipping task ${task.id} - needs at least 3 workers (only has ${workerIds.length})`,
        );
        continue;
      }

      // Only calculate for workers who don't already have eligibility
      const eligibilityRecords =
        await this.createEligibilityService.getEligibilityByTaskId(task.id);
      const workersWithEligibility = eligibilityRecords.map((e) =>
        e.workerId.toString(),
      );

      // Filter out workers who already have eligibility calculated
      const workersToCalculate = workerIds.filter(
        (id) => !workersWithEligibility.includes(id),
      );

      if (workersToCalculate.length === 0) {
        this.logger.debug(
          `All workers for task ${task.id} already have eligibility calculated`,
        );
        continue;
      }

      // Calculate only for workers who don't have eligibility yet
      const accuracies = await this.calculateAccuracyMX(
        task.id,
        workersToCalculate,
      );

      // Update eligibility only for workers who don't have it yet
      for (const workerId of workersToCalculate) {
        const accuracy = accuracies[workerId];
        const eligibilityInput: CreateEligibilityInput = {
          taskId: task.id,
          workerId: workerId,
          accuracy: accuracy,
        };
        await this.createEligibilityService.createEligibility(eligibilityInput);
        this.logger.debug(
          `Created eligibility for worker ${workerId}: ${accuracy}`,
        );
      }
    }
  }
}
