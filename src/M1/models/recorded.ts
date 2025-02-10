import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class RecordedAnswer extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Task', required: true })
  taskId: string; // <== Make sure this field exists!

  @Prop({ type: Types.ObjectId, ref: 'Worker', required: true })
  workerId: string;

  @Prop({ required: true })
  answer: string;
}

export const RecordedAnswerSchema =
  SchemaFactory.createForClass(RecordedAnswer);
