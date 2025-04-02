import { CreateTaskInput } from './create.task.input';
import { InputType, Field, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateTaskInput extends PartialType(CreateTaskInput) {
  @Field(() => String)
  id: string;
}
