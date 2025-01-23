import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { CreateUserService } from 'src/users/services/create.user.service';
import { GetUserService } from 'src/users/services/get.user.service';
import { configService } from 'src/config/config.service';
import { LoginInput, RegisterInput } from '../dto/inputs/create.auth.input';
import { AuthView } from '../dto/views/auth.view';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { GQLThrowType, ThrowGQL } from '@app/gqlerr';
import { Auth } from '../models/auth';
import { parseRegisterInput } from '../models/parser';
import { InjectModel } from '@nestjs/mongoose';
import { UserView } from 'src/users/dto/views/user.view';
import { parseToView } from 'src/users/models/parser';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Auth.name)
    private authModel: Model<Auth>,
    private createUserService: CreateUserService,
    private getUserService: GetUserService,
  ) {}

  async login(input: LoginInput): Promise<AuthView> {
    try {
      const user = await this.getUserService.getUserByEmail(input.email);
      const secretKey = configService.getEnvValue('SECRET_KEY');
      const isPasswordValid = await bcrypt.compare(
        input.password,
        user.password,
      );
      if (!isPasswordValid) {
        throw new ThrowGQL('Invalid credentials', GQLThrowType.NOT_AUTHORIZED);
      }

      const accessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        secretKey,
        { expiresIn: '1h' },
      );

      const refreshToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        secretKey,
        { expiresIn: '7d' },
      );
      await this.authModel.create({
        userId: user.id,
        accessToken: accessToken,
        refreshToken: refreshToken,
      });

      return {
        role: user.role,
        accessToken: accessToken,
        refreshToken: refreshToken,
        userId: user.id,
      };
    } catch (error) {
      throw new ThrowGQL(error.message, GQLThrowType.UNPROCESSABLE);
    }
  }

  async register(input: RegisterInput): Promise<AuthView> {
    try {
      const secretKey = configService.getEnvValue('SECRET_KEY');
      const parsedInput = parseRegisterInput(input);
      const user = await this.createUserService.create(await parsedInput);
      const accessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        secretKey,
        { expiresIn: '1h' },
      );
      const refreshToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        secretKey,
        { expiresIn: '7d' },
      );
      await this.authModel.create({
        userId: user.id,
        accessToken: accessToken,
        refreshToken: refreshToken,
      });
      return {
        role: user.role,
        accessToken: accessToken,
        refreshToken: refreshToken,
        userId: user.id,
      };
    } catch (error) {
      throw new ThrowGQL(error.message, GQLThrowType.UNPROCESSABLE);
    }
  }

  async getLoggedInUser(token: string): Promise<UserView> {
    try {
      const secretKey = configService.getEnvValue('SECRET_KEY');
      const decoded = jwt.verify(token, secretKey);
      const user = await this.getUserService.getUserById(decoded.id);
      return parseToView(user);
    } catch (error) {
      throw new ThrowGQL(error.message, GQLThrowType.UNPROCESSABLE);
    }
  }

  async logout(token: string): Promise<void> {
    await this.authModel.deleteOne({ refreshToken: token });
  }
}
