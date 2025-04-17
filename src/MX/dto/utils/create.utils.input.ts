import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ThresholdType } from '../../models/utils';

@InputType()
export class ThresholdSettingsInput {
  @Field(() => String)
  @IsEnum(ThresholdType)
  thresholdType: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  thresholdValue?: number;
}
