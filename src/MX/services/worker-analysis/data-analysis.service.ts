import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RecordedAnswer } from 'src/MX/models/recorded';
import { Users } from 'src/users/models/user';

@Injectable()
export class MissingWorkerIdCronService {
  private readonly logger = new Logger(MissingWorkerIdCronService.name);

  constructor(
    @InjectModel(RecordedAnswer.name)
    private readonly recordedAnswerModel: Model<RecordedAnswer>,
    @InjectModel(Users.name)
    private readonly usersModel: Model<Users>,
  ) {}

  async handleCron(): Promise<void> {
    try {
      const recordedWorkerIds =
        await this.recordedAnswerModel.distinct('workerId');

      const userIds = await this.usersModel.distinct('_id');

      const missingWorkerIds = recordedWorkerIds.filter((recordedId: any) => {
        return !userIds.some(
          (userId: any) => userId.toString() === recordedId.toString(),
        );
      });

      this.logger.log(`Missing worker IDs: ${missingWorkerIds}`);

      if (missingWorkerIds.length > 0) {
        const result = await this.recordedAnswerModel.deleteMany({
          workerId: { $in: missingWorkerIds },
        });

        this.logger.log(
          `Deleted ${result.deletedCount} recordedAnswer documents with missing worker IDs.`,
        );
      } else {
        this.logger.log('No missing worker IDs found, no documents deleted.');
      }
    } catch (error) {
      this.logger.error(
        'Error saat menghapus recordedAnswer dengan missing worker IDs:',
        error,
      );
    }
  }
}
