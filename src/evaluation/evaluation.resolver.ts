import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { EvaluationService } from './evaluation.service';
import { TesterAnalysisDto } from './dto/views/test-analysis.view';
import { TestResultDto } from './dto/views/test-result.view';

@Resolver()
export class EvaluationResolver {
  constructor(private readonly evaluationService: EvaluationService) {}

  // Query: Mendapatkan riwayat test untuk worker (dengan workerId)
  @Query(() => [TestResultDto])
  async getTestHistory(
    @Args('workerId') workerId: string,
  ): Promise<TestResultDto[]> {
    const results = await this.evaluationService.getTestHistory(workerId);
    return results.map((result) => ({
      id: result._id.toString(),
      workerId: result.workerId,
      testId: result.testId,
      score: result.score,
      feedback: result.feedback,
      createdAt: result.createdAt,
    }));
  }

  @Query(() => [TestResultDto])
  async getTestResults(): Promise<TestResultDto[]> {
    const results = await this.evaluationService.getAllTestResults();
    return results.map((result) => ({
      id: result._id.toString(),
      workerId: result.workerId,
      testId: result.testId,
      score: result.score,
      feedback: result.feedback,
      createdAt: result.createdAt,
    }));
  }

  @Query(() => [TesterAnalysisDto])
  async getTesterAnalysis(): Promise<TesterAnalysisDto[]> {
    return this.evaluationService.getTesterAnalysis();
  }

  @Mutation(() => TestResultDto)
  async recordTestResult(
    @Args('workerId') workerId: string,
    @Args('testId') testId: string,
    @Args('score') score: number,
    @Args('feedback', { nullable: true }) feedback?: string,
  ): Promise<TestResultDto> {
    const result = await this.evaluationService.recordTestResult(
      workerId,
      testId,
      score,
      feedback,
    );
    return {
      id: result._id.toString(),
      workerId: result.workerId,
      testId: result.testId,
      score: result.score,
      feedback: result.feedback,
      createdAt: result.createdAt,
    };
  }
}
