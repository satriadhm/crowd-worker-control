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

/**
 * Service for calculating worker accuracy using the M-X algorithm
 * Updated with correct iteration times: 4:00-5:29, 5:30-6:59, 7:00+
 */
@Injectable()
export class AccuracyCalculationServiceMX {
  private readonly logger = new Logger(AccuracyCalculationServiceMX.name);
  private currentIteration = 1; // Start from iteration 1
  private readonly maxIterations = 3; // Total 3 iterations
  private readonly workersPerIteration = [3, 6, 9]; // Target number of workers per iteration

  // Define specific timestamps for the three iterations based on requirements
  private readonly iterationTimes = [
    new Date('2025-04-15T04:00:00'), // Iteration 1 starts at 4:00
    new Date('2025-04-15T05:30:00'), // Iteration 2 starts at 5:30
    new Date('2025-04-15T07:00:00'), // Iteration 3 starts at 7:00
  ];

  // Define end times for each iteration
  private readonly iterationEndTimes = [
    new Date('2025-04-15T05:29:59'), // Iteration 1 ends at 5:29:59
    new Date('2025-04-15T06:59:59'), // Iteration 2 ends at 6:59:59
    new Date('2025-04-15T23:59:59'), // Iteration 3 ends at end of day
  ];

  constructor(
    @InjectModel(RecordedAnswer.name)
    private readonly recordedAnswerModel: Model<RecordedAnswer>,
    @InjectModel(Users.name)
    private readonly userModel: Model<Users>,
    private readonly createEligibilityService: CreateEligibilityService,
    private readonly getTaskService: GetTaskService,
  ) {}

  /**
   * Determine which iteration we are currently in based on the current time
   */
  private getCurrentIteration(): number {
    const now = new Date();

    // For testing purposes, we can force the current time
    // const now = new Date('2025-04-15T07:30:00'); // Uncomment for testing specific times

    // Check which iteration we're in
    if (now >= this.iterationTimes[2]) {
      return 3; // We're in iteration 3 (starting from 7:00)
    } else if (now >= this.iterationTimes[1]) {
      return 2; // We're in iteration 2 (5:30 - 6:59)
    } else if (now >= this.iterationTimes[0]) {
      return 1; // We're in iteration 1 (4:00 - 5:29)
    } else {
      return 0; // We haven't started any iterations yet
    }
  }

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
   * Get workers for the current iteration based on worker creation time
   */
  private async getWorkersForCurrentIteration(): Promise<string[]> {
    const currentIteration = this.getCurrentIteration();
    if (currentIteration === 0) {
      return []; // No iterations have started yet
    }

    // Get start and end time for the current iteration
    const startTime = this.iterationTimes[currentIteration - 1];
    const endTime = this.iterationEndTimes[currentIteration - 1];

    this.logger.log(
      `Getting workers for iteration ${currentIteration} (${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()})`,
    );

    // Get workers created within this timeframe
    const workers = await this.userModel
      .find({
        role: 'worker',
        createdAt: {
          $gte: startTime,
          $lte: endTime,
        },
      })
      .sort({ createdAt: 1 })
      .limit(this.workersPerIteration[currentIteration - 1])
      .exec();

    const workerIds = workers.map((worker) => worker._id.toString());

    this.logger.log(
      `Found ${workerIds.length} workers for iteration ${currentIteration}`,
    );

    return workerIds;
  }

  /**
   * Get all workers from all iterations up to and including current iteration
   */
  private async getAllWorkersUpToCurrentIteration(): Promise<string[]> {
    const currentIteration = this.getCurrentIteration();
    if (currentIteration === 0) {
      return []; // No iterations have started yet
    }

    const earliestStartTime = this.iterationTimes[0];

    const latestEndTime = this.iterationEndTimes[currentIteration - 1];

    let totalWorkerLimit = 0;
    for (let i = 0; i < currentIteration; i++) {
      totalWorkerLimit += this.workersPerIteration[i];
    }

    this.logger.log(
      `Getting all workers from iteration 1 through ${currentIteration} (${earliestStartTime.toLocaleTimeString()} - ${latestEndTime.toLocaleTimeString()})`,
    );

    // Get all workers created from iteration 1 start to current iteration end
    const workers = await this.userModel
      .find({
        role: 'worker',
        createdAt: {
          $gte: earliestStartTime,
          $lte: latestEndTime,
        },
      })
      .sort({ createdAt: 1 })
      .limit(totalWorkerLimit)
      .exec();

    const workerIds = workers.map((worker) => worker._id.toString());

    this.logger.log(
      `Found ${workerIds.length} total workers across all iterations up to ${currentIteration}`,
    );

    return workerIds;
  }

  /**
   * Method calculateEligibility melakukan perhitungan accuracy untuk tiap task,
   * kemudian menentukan status eligible untuk masing-masing worker berdasarkan threshold.
   * Updated to work with new iteration times.
   */
  @Cron(CronExpression.EVERY_12_HOURS)
  async calculateEligibility() {
    try {
      const currentIteration = this.getCurrentIteration();
      this.logger.log(
        `Running eligibility calculation for iteration ${currentIteration}`,
      );

      if (currentIteration === 0) {
        this.logger.log(
          'No iterations have started yet. Skipping eligibility calculations.',
        );
        return;
      }

      const allWorkerIds = await this.getAllWorkersUpToCurrentIteration();
      if (allWorkerIds.length === 0) {
        this.logger.warn('No workers available up to current iteration');
        return;
      }

      this.logger.log(
        `Processing ${allWorkerIds.length} workers across iterations 1-${currentIteration}`,
      );

      const tasks = await this.getTaskService.getValidatedTasks();
      if (!tasks || tasks.length === 0) {
        this.logger.warn('No validated tasks found');
        return;
      }

      for (const task of tasks) {
        const recordedAnswers = await this.recordedAnswerModel.find({
          taskId: task.id,
          workerId: { $in: allWorkerIds },
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

        const accuracies = await this.calculateAccuracyMX(task.id, workerIds);

        for (const workerId of workerIds) {
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
            `Created eligibility for worker ${workerId} in iteration ${currentIteration}: ${accuracy}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(`Error in calculateEligibility: ${error.message}`);
    }
  }
}
