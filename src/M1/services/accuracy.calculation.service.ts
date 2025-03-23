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
import { configService } from 'src/config/config.service';

@Injectable()
export class AccuracyCalculationService {
  private readonly logger = new Logger(AccuracyCalculationService.name);

  constructor(
    @InjectModel(RecordedAnswer.name)
    private readonly recordedAnswerModel: Model<RecordedAnswer>,
    private readonly CreateEligibilityService: CreateEligibilityService,
    private readonly getTaskService: GetTaskService,
  ) {}

  /**
   * Menghitung nilai accuracy untuk pekerja pada suatu task.
   */
  async calculateAccuracy(
    taskId: string,
    workers: string[],
    windowSize: number,
    M: number,
  ): Promise<Record<string, number>> {
    this.logger.log(`Mulai perhitungan accuracy untuk taskId: ${taskId}`);
    const task = await this.getTaskService.getTaskById(taskId);
    if (!task) {
      this.logger.error(`Task dengan ID ${taskId} tidak ditemukan`);
      throw new ThrowGQL(
        `Task dengan ID ${taskId} tidak ditemukan`,
        GQLThrowType.NOT_FOUND,
      );
    }
    const N = task.answers.length;
    this.logger.log(`Task ditemukan, jumlah soal: ${N}`);

    const answers = await this.recordedAnswerModel.find({ taskId });
    const numWorkers = workers.length;
    this.logger.log(`Jumlah pekerja: ${numWorkers}`);

    // Inisialisasi matriks Qij
    const QijMatrix: number[][] = Array.from({ length: numWorkers }, () =>
      Array(numWorkers).fill(0),
    );

    // Perhitungan Qij untuk setiap pasangan pekerja dalam subset
    for (let start = 0; start <= numWorkers - windowSize; start++) {
      const subsetWorkers = workers.slice(start, start + windowSize);
      this.logger.debug(
        `Memproses subset pekerja: ${subsetWorkers.join(', ')}`,
      );

      for (let i = 0; i < subsetWorkers.length; i++) {
        for (let j = i + 1; j < subsetWorkers.length; j++) {
          let Tij = 0;
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
          this.logger.debug(
            `Tij antara worker ${subsetWorkers[i]} dan ${subsetWorkers[j]}: ${Tij}`,
          );
          const Qij = Tij / N;
          this.logger.debug(
            `Qij antara worker ${subsetWorkers[i]} dan ${subsetWorkers[j]}: ${Qij}`,
          );
          const indexI = workers.indexOf(subsetWorkers[i]);
          const indexJ = workers.indexOf(subsetWorkers[j]);
          QijMatrix[indexI][indexJ] = Qij;
          QijMatrix[indexJ][indexI] = Qij; // Matriks simetris
        }
      }
    }

    // Metode fixed-point untuk menyelesaikan nilai akurasi A_i
    const accuracies = this.solveForAccuracies(QijMatrix, workers, M);
    this.logger.log(
      `Perhitungan selesai. Akurasi akhir: ${JSON.stringify(accuracies)}`,
    );
    return accuracies;
  }

  /**
   * Menyelesaikan nilai akurasi secara iteratif berdasarkan matriks Qij.
   */
  private solveForAccuracies(
    QijMatrix: number[][],
    workers: string[],
    M: number,
  ): Record<string, number> {
    const numWorkers = workers.length;
    let A = Array(numWorkers).fill(0.5); // tebakan awal akurasi
    const tolerance = 0.0001;
    let maxIterations = 1000;
    const epsilon = 1e-6; // untuk menghindari pembagian dengan nol

    let iteration = 0;
    while (maxIterations > 0) {
      iteration++;
      maxIterations--;
      const newA = new Array(numWorkers).fill(0);

      for (let i = 0; i < numWorkers; i++) {
        let sumEstimates = 0;
        let count = 0;
        for (let j = 0; j < numWorkers; j++) {
          if (i === j) continue;
          const Qij = QijMatrix[i][j];
          if (Math.abs(M * A[j] - 1) < epsilon) continue;
          const estimate = ((M - 1) * Qij + A[j] - 1) / (M * A[j] - 1);
          sumEstimates += estimate;
          count++;
          this.logger.debug(
            `Iterasi ${iteration} - Estimasi A[${i}] berdasarkan worker ${j}: ${estimate}`,
          );
        }
        newA[i] = count > 0 ? sumEstimates / count : A[i];
      }

      let maxDiff = 0;
      for (let i = 0; i < numWorkers; i++) {
        maxDiff = Math.max(maxDiff, Math.abs(newA[i] - A[i]));
      }
      this.logger.debug(`Iterasi ${iteration} - Max diff: ${maxDiff}`);
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

    const threshold = Number(configService.getEnvValue('M1_THRESHOLD'));

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

      for (const workerId of workerIds) {
        const accuracy = accuracies[workerId];
        const eligible = accuracy >= threshold;
        const eligibilityInput: CreateEligibilityInput = {
          taskId: task.id,
          workerId: workerId,
          accuracy: accuracy,
          eligible: eligible,
        };
        await this.CreateEligibilityService.upSertEligibility(eligibilityInput);
      }
    }
  }
}
