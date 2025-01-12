import { ObjectType, Field } from '@nestjs/graphql';
import { Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema()
@ObjectType()
export class Auth {
  @Field()
  authId: string;

  @Field()
  accessToken: string;

  @Field()
  refreshToken: string;
}

export type AuthDocument = HydratedDocument<Auth>;
export const AuthSchema = SchemaFactory.createForClass(Auth);
