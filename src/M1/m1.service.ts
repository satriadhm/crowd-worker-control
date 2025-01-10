import { Injectable } from '@nestjs/common';

@Injectable()
export class M1Service {
  private workers = ['w1', 'w2', 'w3']; // ID pekerja

  async calculateAccuracy(tasks: any[]): Promise<Record<string, number>> {
    const N = tasks.length;
    const agreements: Record<string, number> = {
      w1_w2: 0,
      w1_w3: 0,
      w2_w3: 0,
    };

    // Langkah 1: Hitung kesepakatan jawaban
    tasks.forEach((task) => {
      const answers = task.workerAnswers.reduce(
        (acc, answer) => {
          acc[answer.workerId] = answer.selectedAnswer;
          return acc;
        },
        {} as Record<string, string>,
      );

      if (answers['w1'] === answers['w2']) agreements.w1_w2++;
      if (answers['w1'] === answers['w3']) agreements.w1_w3++;
      if (answers['w2'] === answers['w3']) agreements.w2_w3++;
    });

    // Langkah 2: Normalisasi kesepakatan (Qij)
    const Qij = {
      w1_w2: agreements.w1_w2 / N,
      w1_w3: agreements.w1_w3 / N,
      w2_w3: agreements.w2_w3 / N,
    };

    // Langkah 3: Selesaikan persamaan untuk menghitung akurasi
    const accuracies = this.solveAccuracies(Qij);
    console.log('Worker accuracies:', accuracies);

    return accuracies;
  }

  private solveAccuracies(Qij: Record<string, number>): Record<string, number> {
    const M = 2; // Jumlah pilihan jawaban (contoh: A, B)

    // Sistem persamaan non-linear
    const equations = (A: number[]) => [
      Qij.w1_w2 - (A[0] * A[1] + ((1 - A[0]) * (1 - A[1])) / (M - 1)),
      Qij.w1_w3 - (A[0] * A[2] + ((1 - A[0]) * (1 - A[2])) / (M - 1)),
      Qij.w2_w3 - (A[1] * A[2] + ((1 - A[1]) * (1 - A[2])) / (M - 1)),
    ];

    // Turunan Jacobian
    const jacobian = (A: number[]) => [
      [
        A[1] - (1 - A[1]) / (M - 1), // dF1/dA1
        A[0] - (1 - A[0]) / (M - 1), // dF1/dA2
        0, // dF1/dA3
      ],
      [
        A[2] - (1 - A[2]) / (M - 1), // dF2/dA1
        0, // dF2/dA2
        A[0] - (1 - A[0]) / (M - 1), // dF2/dA3
      ],
      [
        0, // dF3/dA1
        A[2] - (1 - A[2]) / (M - 1), // dF3/dA2
        A[1] - (1 - A[1]) / (M - 1), // dF3/dA3
      ],
    ];

    // Iterasi Newton-Raphson
    const tolerance = 1e-6;
    const maxIterations = 100;
    let A = [0.5, 0.5, 0.5]; // Nilai awal
    for (let iteration = 0; iteration < maxIterations; iteration++) {
      const F = equations(A);
      const J = jacobian(A);

      // Solve J * delta = -F
      const delta = this.lsolve(
        J,
        F.map((f) => -f),
      );

      // Update nilai A
      A = A.map((a, i) => a + delta[i]);

      // Cek toleransi
      if (Math.max(...delta.map(Math.abs)) < tolerance) break;
    }

    return { w1: A[0], w2: A[1], w3: A[2] };
  }

  // Penyelesaian linear untuk sistem Jacobian
  private lsolve(J: number[][], F: number[]): number[] {
    const size = J.length;
    const A = J.map((row, i) => [...row, F[i]]); // Augmented matrix
    for (let i = 0; i < size; i++) {
      // Pivoting
      let maxRow = i;
      for (let k = i + 1; k < size; k++) {
        if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) maxRow = k;
      }
      [A[i], A[maxRow]] = [A[maxRow], A[i]];

      // Make the diagonal element 1
      const diag = A[i][i];
      for (let j = i; j <= size; j++) A[i][j] /= diag;

      // Eliminate column
      for (let k = 0; k < size; k++) {
        if (k === i) continue;
        const factor = A[k][i];
        for (let j = i; j <= size; j++) A[k][j] -= factor * A[i][j];
      }
    }

    // Extract solution
    return A.map((row) => row[size]);
  }
}
