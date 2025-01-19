import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { CreateUserService } from 'src/users/services/create.user.service';
import { GetUserService } from 'src/users/services/get.user.service';
import { configService } from 'src/config/config.service';
import { LoginInput, RegisterInput } from '../dto/inputs/create.auth.input';
import { AuthView } from '../dto/views/auth.view';
import * as jwt from 'jsonwebtoken';
import { createHmac } from 'crypto';
import { GQLThrowType, ThrowGQL } from '@app/gqlerr';
import { Auth } from '../models/auth';
import { parseRegisterInput } from '../models/parser';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Auth.name)
    private authModel: Model<Auth>,
    private createUserService: CreateUserService,
    private getUserService: GetUserService,
  ) {}

  async login(input: LoginInput): Promise<AuthView> {
    const user = await this.getUserService.getUserByEmail(input.email);
    const secretKey = configService.getEnvValue('SECRET_KEY');
    const hashedPassword = createHmac('sha256', secretKey)
      .update(input.password)
      .digest('hex');

    if (user && user.password === hashedPassword) {
      const accessToken = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        secretKey,
        { expiresIn: '1h' },
      );

      const refreshToken = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        secretKey,
        { expiresIn: '7d' },
      );

      await this.authModel.create({
        userId: user._id,
        accessToken: accessToken,
        refreshToken: refreshToken,
      });

      return {
        role: user.role,
        accessToken: accessToken,
        refreshToken: refreshToken,
        userId: user._id,
      };
    }
    return null;
  }

  async register(input: RegisterInput): Promise<AuthView> {
    try {
      const secretKey = configService.getEnvValue('SECRET_KEY');
      const parsedInput = parseRegisterInput(input);
      const user = await this.createUserService.create(await parsedInput);
      const accessToken = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        secretKey,
        { expiresIn: '1h' },
      );
      const refreshToken = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        secretKey,
        { expiresIn: '7d' },
      );
      await this.authModel.create({
        userId: user._id,
        accessToken: accessToken,
        refreshToken: refreshToken,
      });
      return {
        role: user.role,
        accessToken: accessToken,
        refreshToken: refreshToken,
        userId: user._id,
      };
    } catch (error) {
      throw new ThrowGQL(error.message, GQLThrowType.UNPROCESSABLE);
    }
  }
}
