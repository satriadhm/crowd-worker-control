import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class EligibilityView {
  @Field()
  id: string;

  @Field()
  taskId: string;

  @Field()
  workerId: string;

  @Field()
  accuracy: number;

  @Field()
  feedback: string;

  @Field()
  Date: Date;
}
