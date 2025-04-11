import { Injectable, Logger } from '@nestjs/common';
import { GetTaskService } from './../../tasks/services/get.task.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RecordedAnswer } from '../models/recorded';
import { GQLThrowType, ThrowGQL } from '@app/gqlerr';
import { Cron } from '@nestjs/schedule';
import { CronExpression } from 'src/lib/cron.enum';
import { CreateEligibilityService } from './eligibility/create.eligibility.service';
import { CreateEligibilityInput } from '../dto/eligibility/inputs/create.eligibility.input';

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

    // Hasil akhir akurasi tiap worker
    const finalAccuracies: Record<string, number> = {};
    workers.forEach((workerId) => {
      finalAccuracies[workerId] = 1.0; // Initial value for product
    });

    // Map untuk menyimpan jawaban worker
    const workerAnswersMap: Record<string, string[]> = {};
    for (const workerId of workers) {
      const workerAnswers = answers
        .filter((a) => a.workerId.toString() === workerId)
        .map((a) => a.answer);
      workerAnswersMap[workerId] = workerAnswers;
    }

    // Step 2-9: Untuk setiap opsi jawaban, hitung akurasi pekerja
    for (let optionIdx = 0; optionIdx < M; optionIdx++) {
      this.logger.debug(`Memproses opsi ${optionIdx + 1} dari ${M}`);

      // Konversi jawaban menjadi biner (1 jika sama dengan opsi saat ini, 0 jika tidak)
      const binaryAnswersMap: Record<string, number[]> = {};
      for (const workerId of workers) {
        binaryAnswersMap[workerId] = workerAnswersMap[workerId].map((ans) =>
          parseInt(ans) === optionIdx ? 1 : 0,
        );
      }

      // Hitung akurasi untuk opsi saat ini menggunakan metode fixed-point
      const optionAccuracies = await this.calculateBinaryOptionAccuracy(
        taskId,
        workers,
        binaryAnswersMap,
        N,
      );

      // Simpan akurasi per opsi
      for (const workerId of workers) {
        // Akumulasi dengan perkalian (sesuai dengan algoritma M-X)
        finalAccuracies[workerId] *= optionAccuracies[workerId];
      }
    }

    // Format hasil akhir
    for (const workerId of workers) {
      finalAccuracies[workerId] = parseFloat(
        finalAccuracies[workerId].toFixed(2),
      );
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
    N: number,
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
          for (let k = 0; k < N; k++) {
            if (binaryAnswersMap[i][k] === binaryAnswersMap[j][k]) {
              agreementCount++;
            }
          }
          const Qij = agreementCount / N;

          // Rumus dari algoritma 2 yang dimodifikasi untuk kasus biner
          const Aj = accuracies[j];
          const numerator = 2 * Qij - 1 + (1 - Aj);
          const denominator = 2 * Aj - 1;

          // Hindari pembagian dengan nol
          if (Math.abs(denominator) > 0.001) {
            estimates.push(numerator / denominator);
          }
        }

        // Rata-ratakan estimasi dan batasi ke [0,1]
        if (estimates.length > 0) {
          const avg =
            estimates.reduce((sum, val) => sum + val, 0) / estimates.length;
          newAccuracies[i] = Math.max(0, Math.min(1, avg));
        } else {
          // Jika tidak ada estimasi valid, gunakan nilai sebelumnya
          newAccuracies[i] = accuracies[i];
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
  @Cron(CronExpression.EVERY_5_SECONDS)
  async calculateEligibility() {
    const tasks = await this.getTaskService.getValidatedTasks();
    if (!tasks) throw new Error('Task not found');

    for (const task of tasks) {
      const recordedAnswers = await this.recordedAnswerModel.find({
        taskId: task.id,
      });

      const workerIds = Array.from(
        new Set(recordedAnswers.map((answer) => answer.workerId.toString())),
      );

      if (workerIds.length < 3) continue; // Minimal 3 worker diperlukan

      // Gunakan algoritma M-X untuk menghitung akurasi
      const accuracies = await this.calculateAccuracyMX(task.id, workerIds);

      // Update eligibility untuk masing-masing worker berdasarkan threshold
      for (const workerId of workerIds) {
        const accuracy = accuracies[workerId];
        const eligibilityInput: CreateEligibilityInput = {
          taskId: task.id,
          workerId: workerId,
          accuracy: accuracy,
        };
        await this.createEligibilityService.upSertEligibility(eligibilityInput);
      }
    }
  }
}
