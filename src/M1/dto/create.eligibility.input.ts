import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateEligibilityInput {
  @Field()
  taskId: string;

  @Field()
  workerId: string;
}
