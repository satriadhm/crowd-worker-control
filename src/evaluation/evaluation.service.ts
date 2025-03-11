import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TesterAnalysisDto } from './dto/views/test-analysis.view';
import { TestResult, TestResultDocument } from './entities/test-result.entity';

@Injectable()
export class EvaluationService {
  constructor(
    @InjectModel(TestResult.name)
    private testResultModel: Model<TestResultDocument>,
  ) {}

  async getTestHistory(workerId: string): Promise<TestResult[]> {
    return this.testResultModel
      .find({ workerId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getAllTestResults(): Promise<TestResult[]> {
    return this.testResultModel.find().sort({ createdAt: -1 }).exec();
  }

  async getTesterAnalysis(): Promise<TesterAnalysisDto[]> {
    const results = await this.testResultModel.aggregate([
      {
        $group: {
          _id: '$workerId',
          averageScore: { $avg: '$score' },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          workerId: '$_id',
          averageScore: 1,
          accuracy: { $divide: ['$averageScore', 100] },
        },
      },
    ]);

    return results.map((r) => ({
      workerId: r.workerId,
      testerName: r.workerId, // Jika tidak ada data nama, gunakan workerId; nantinya bisa di-populate dari user service
      averageScore: r.averageScore,
      accuracy: r.accuracy,
    }));
  }

  async recordTestResult(
    workerId: string,
    testId: string,
    score: number,
    feedback?: string,
  ): Promise<TestResult> {
    const newResult = new this.testResultModel({
      workerId,
      testId,
      score,
      feedback,
    });
    return newResult.save();
  }
}
