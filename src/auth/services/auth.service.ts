import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { CreateUserService } from 'src/users/services/create.user.service';
import { GetUserService } from 'src/users/services/get.user.service';
import { Auth, parseRegisterInput } from '../models/auth';
import { configService } from 'src/config/config.service';
import { LoginInput, RegisterInput } from '../dto/inputs/create.auth.input';
import { AuthView } from '../dto/views/auth.view';
import * as jwt from 'jsonwebtoken';
import { createHmac } from 'crypto';
import { GQLThrowType, ThrowGQL } from '@app/gqlerr';

@Injectable()
export class AuthService {
  constructor(
    private createUserService: CreateUserService,
    private getUserService: GetUserService,
    private authModel: Model<Auth>,
  ) {}

  async login(input: LoginInput): Promise<AuthView> {
    const user = await this.getUserService.getUserByEmail(input.email);
    const secretKey = configService.getEnvValue('SECRET_KEY');
    const hashedPassword = createHmac('sha256', secretKey)
      .update(input.password)
      .digest('hex');

    if (user && user.password === hashedPassword) {
      const accessToken = jwt.sign(
        { id: user.id, email: user.email },
        secretKey,
        { expiresIn: '1h' },
      );

      const refreshToken = jwt.sign(
        { id: user.id, email: user.email },
        secretKey,
        { expiresIn: '7d' },
      );

      await this.authModel.create({
        userId: user.id,
        accessToken,
        refreshToken,
      });

      return {
        accessToken,
        refreshToken,
        userId: user.id,
      };
    }
    return null;
  }

  async register(input: RegisterInput): Promise<AuthView> {
    try {
      const secretKey = configService.getEnvValue('SECRET_KEY');
      const parsedInput = parseRegisterInput(input);
      const user = await this.createUserService.create(parsedInput);
      const accessToken = jwt.sign(
        { id: user.id, email: user.email },
        secretKey,
        { expiresIn: '1h' },
      );

      const refreshToken = jwt.sign(
        { id: user.id, email: user.email },
        secretKey,
        { expiresIn: '7d' },
      );

      await this.authModel.create({
        userId: user.id,
        accessToken,
        refreshToken,
      });
      return {
        accessToken,
        refreshToken,
        userId: user.id,
      };
    } catch (error) {
      throw new ThrowGQL(error.message, GQLThrowType.UNPROCESSABLE);
    }
  }
}
