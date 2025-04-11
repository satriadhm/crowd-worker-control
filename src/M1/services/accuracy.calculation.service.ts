// import { Injectable, Logger } from '@nestjs/common';
// import { GetTaskService } from './../../tasks/services/get.task.service';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { RecordedAnswer } from '../models/recorded';
// import { GQLThrowType, ThrowGQL } from '@app/gqlerr';
// import { Cron } from '@nestjs/schedule';
// import { CronExpression } from 'src/lib/cron.enum';
// import { CreateEligibilityService } from './eligibility/create.eligibility.service';
// import { CreateEligibilityInput } from '../dto/eligibility/inputs/create.eligibility.input';

// @Injectable()
// export class AccuracyCalculationService {
//   private readonly logger = new Logger(AccuracyCalculationService.name);

//   constructor(
//     @InjectModel(RecordedAnswer.name)
//     private readonly recordedAnswerModel: Model<RecordedAnswer>,
//     private readonly CreateEligibilityService: CreateEligibilityService,
//     private readonly getTaskService: GetTaskService,
//   ) {}

//   /**
//    * Menghitung accuracy tiap worker dengan menerapkan sliding window berukuran 3.
//    * Untuk setiap window (triple), dihitung nilai Qij antar pasangan worker, kemudian
//    * sistem persamaan untuk tiga worker diselesaikan menggunakan metode fixed-point.
//    * Hasilnya diaggregasi (dirata-rata) untuk setiap worker yang muncul di beberapa window.
//    */
//   async calculateAccuracy(
//     taskId: string,
//     workers: string[],
//     windowSize: number, // harus 3
//   ): Promise<Record<string, number>> {
//     this.logger.log(`Mulai perhitungan accuracy untuk taskId: ${taskId}`);
//     const task = await this.getTaskService.getTaskById(taskId);
//     if (!task) {
//       this.logger.error(`Task dengan ID ${taskId} tidak ditemukan`);
//       throw new ThrowGQL(
//         `Task dengan ID ${taskId} tidak ditemukan`,
//         GQLThrowType.NOT_FOUND,
//       );
//     }
//     const N = task.answers.length;
//     const M = task.nAnswers || 4; // Get M from task or default to 4
//     this.logger.log(`Task ditemukan, jumlah soal: ${N}, opsi jawaban: ${M}`);

//     const answers = await this.recordedAnswerModel.find({ taskId });
//     const numWorkers = workers.length;
//     this.logger.log(`Jumlah pekerja: ${numWorkers}`);

//     // Map untuk menyimpan estimasi akurasi setiap worker dari masing-masing window triple
//     const estimatesMap: Record<string, number[]> = {};
//     workers.forEach((workerId) => (estimatesMap[workerId] = []));

//     // Sliding window: proses setiap triple worker
//     for (let start = 0; start <= numWorkers - windowSize; start++) {
//       const workerTriple = workers.slice(start, start + windowSize);
//       this.logger.debug(`Memproses window: ${workerTriple.join(', ')}`);
//       // Hitung nilai Q untuk triple ini
//       const { Q12, Q13, Q23 } = this.computeTripleQ(
//         taskId,
//         workerTriple,
//         answers,
//         N,
//       );
//       this.logger.debug(
//         `Window ${workerTriple.join(', ')}: Q12=${Q12.toFixed(2)}, Q13=${Q13.toFixed(2)}, Q23=${Q23.toFixed(2)}`,
//       );
//       // Selesaikan estimasi accuracy untuk tiga worker pada window ini
//       const [A1, A2, A3] = this.solveTriple(Q12, Q13, Q23, M); // Pass M parameter
//       this.logger.debug(
//         `Hasil window: ${workerTriple[0]}=${A1}, ${workerTriple[1]}=${A2}, ${workerTriple[2]}=${A3}`,
//       );
//       // Simpan estimasi ke masing-masing worker
//       estimatesMap[workerTriple[0]].push(A1);
//       estimatesMap[workerTriple[1]].push(A2);
//       estimatesMap[workerTriple[2]].push(A3);
//     }

//     // Agregasi: rata-rata estimasi untuk setiap worker
//     const accuracyMap: Record<string, number> = {};
//     workers.forEach((workerId) => {
//       const arr = estimatesMap[workerId];
//       const avg = arr.reduce((sum, val) => sum + val, 0) / (arr.length || 1);
//       accuracyMap[workerId] = parseFloat(avg.toFixed(2));
//     });

//     this.logger.log(
//       `Perhitungan selesai. Akurasi akhir: ${JSON.stringify(accuracyMap)}`,
//     );
//     return accuracyMap;
//   }

//   /**
//    * Fungsi computeTripleQ menghitung nilai Qij untuk sepasang worker dalam satu window triple.
//    * Mengembalikan Q12, Q13, Q23.
//    */
//   private computeTripleQ(
//     taskId: string,
//     workerTriple: string[],
//     answers: any[],
//     N: number,
//   ): { Q12: number; Q13: number; Q23: number } {
//     let T12 = 0,
//       T13 = 0,
//       T23 = 0;
//     // workerTriple[0] = w1, [1] = w2, [2] = w3
//     for (let k = 0; k < N; k++) {
//       const a1 = answers.find(
//         (a) =>
//           a.workerId.toString() === workerTriple[0] &&
//           a.taskId.toString() === taskId,
//       );
//       const a2 = answers.find(
//         (a) =>
//           a.workerId.toString() === workerTriple[1] &&
//           a.taskId.toString() === taskId,
//       );
//       const a3 = answers.find(
//         (a) =>
//           a.workerId.toString() === workerTriple[2] &&
//           a.taskId.toString() === taskId,
//       );
//       if (a1 && a2 && a1.answer === a2.answer) T12++;
//       if (a1 && a3 && a1.answer === a3.answer) T13++;
//       if (a2 && a3 && a2.answer === a3.answer) T23++;
//     }
//     return {
//       Q12: T12 / N,
//       Q13: T13 / N,
//       Q23: T23 / N,
//     };
//   }

//   /**
//    * Fungsi solveTriple menyelesaikan sistem persamaan untuk tiga worker.
//    * Diberikan persamaan:
//    *   Q12 = 1 - A1 - A2 + 2*A1*A2
//    *   Q13 = 1 - A1 - A3 + 2*A1*A3
//    *   Q23 = 1 - A2 - A3 + 2*A2*A3
//    * Maka, dari masing-masing persamaan dapat diperoleh:
//    *   A1 = (Q12 + A2 - 1) / (2*A2 - 1)  (jika 2*A2 - 1 ≠ 0)
//    * dan seterusnya.
//    * Fungsi ini menggunakan iterasi fixed-point untuk menyelesaikan nilai A1, A2, A3.
//    */
//   private solveTriple(
//     Q12: number,
//     Q13: number,
//     Q23: number,
//     M: number,
//   ): [number, number, number] {
//     let A1 = 0.5,
//       A2 = 0.5,
//       A3 = 0.5;
//     const tolerance = 0.0001;
//     let iterations = 1000;

//     while (iterations-- > 0) {
//       let newA1, newA2, newA3;

//       // Update A1 using Q12 and Q13
//       const numeratorQ12 = (M + 1) * Q12 - (M - 1) + (M - 1) * A2;
//       const denominatorQ12 = 2 * M * A2 - (M - 1);
//       const termQ12 = denominatorQ12 !== 0 ? numeratorQ12 / denominatorQ12 : A1;

//       const numeratorQ13 = (M + 1) * Q13 - (M - 1) + (M - 1) * A3;
//       const denominatorQ13 = 2 * M * A3 - (M - 1);
//       const termQ13 = denominatorQ13 !== 0 ? numeratorQ13 / denominatorQ13 : A1;

//       newA1 = (termQ12 + termQ13) / 2;

//       // Update A2 using Q12 and Q23
//       const numeratorQ21 = (M + 1) * Q12 - (M - 1) + (M - 1) * A1;
//       const denominatorQ21 = 2 * M * A1 - (M - 1);
//       const termQ21 = denominatorQ21 !== 0 ? numeratorQ21 / denominatorQ21 : A2;

//       const numeratorQ23 = (M + 1) * Q23 - (M - 1) + (M - 1) * A3;
//       const denominatorQ23 = 2 * M * A3 - (M - 1);
//       const termQ23 = denominatorQ23 !== 0 ? numeratorQ23 / denominatorQ23 : A2;

//       newA2 = (termQ21 + termQ23) / 2;

//       // Update A3 using Q13 and Q23
//       const numeratorQ31 = (M + 1) * Q13 - (M - 1) + (M - 1) * A1;
//       const denominatorQ31 = 2 * M * A1 - (M - 1);
//       const termQ31 = denominatorQ31 !== 0 ? numeratorQ31 / denominatorQ31 : A3;

//       const numeratorQ32 = (M + 1) * Q23 - (M - 1) + (M - 1) * A2;
//       const denominatorQ32 = 2 * M * A2 - (M - 1);
//       const termQ32 = denominatorQ32 !== 0 ? numeratorQ32 / denominatorQ32 : A3;

//       newA3 = (termQ31 + termQ32) / 2;

//       // Clamp to [0,1]
//       newA1 = Math.max(0, Math.min(1, newA1));
//       newA2 = Math.max(0, Math.min(1, newA2));
//       newA3 = Math.max(0, Math.min(1, newA3));

//       // Check convergence
//       if (
//         Math.abs(newA1 - A1) < tolerance &&
//         Math.abs(newA2 - A2) < tolerance &&
//         Math.abs(newA3 - A3) < tolerance
//       ) {
//         A1 = newA1;
//         A2 = newA2;
//         A3 = newA3;
//         break;
//       }

//       A1 = newA1;
//       A2 = newA2;
//       A3 = newA3;
//     }

//     return [
//       parseFloat(A1.toFixed(2)),
//       parseFloat(A2.toFixed(2)),
//       parseFloat(A3.toFixed(2)),
//     ];
//   }

//   /**
//    * Method calculateEligibility melakukan perhitungan accuracy untuk tiap task,
//    * kemudian menentukan status eligible untuk masing-masing worker berdasarkan threshold.
//    */
//   @Cron(CronExpression.EVERY_5_SECONDS)
//   async calculateEligibility() {
//     const tasks = await this.getTaskService.getTasks();
//     if (!tasks) throw new Error('Task not found');
//     for (const task of tasks) {
//       const recordedAnswers = await this.recordedAnswerModel.find({
//         taskId: task.id,
//       });
//       const workerIds = Array.from(
//         new Set(recordedAnswers.map((answer) => answer.workerId.toString())),
//       );
//       if (workerIds.length < 3) continue; // Minimal 3 worker diperlukan
//       // kita gunakan sliding window berukuran 3 untuk setiap kelompok.
//       const accuracies = await this.calculateAccuracy(task.id, workerIds, 3);

//       // Update eligibility untuk masing-masing worker berdasarkan threshold
//       for (const workerId of workerIds) {
//         const accuracy = accuracies[workerId];
//         const eligibilityInput: CreateEligibilityInput = {
//           taskId: task.id,
//           workerId: workerId,
//           accuracy: accuracy,
//         };
//         await this.CreateEligibilityService.upSertEligibility(eligibilityInput);
//       }
//     }
//   }
// }
