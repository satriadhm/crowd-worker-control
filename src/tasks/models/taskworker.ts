import { Field, ObjectType } from '@nestjs/graphql';
import { Schema } from '@nestjs/mongoose';

@Schema()
@ObjectType()
export class TaskWorker {
  @Field()
  workerId: string;

  @Field()
  taskId: string;

  @Field()
  isCompleted: boolean;
}
