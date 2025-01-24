import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import * as jwt from 'jsonwebtoken';
import { configService } from 'src/config/config.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const ctx = GqlExecutionContext.create(context).getContext();
    const req = ctx.req;
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return false;
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(
        token,
        configService.getEnvValue('SECRET_KEY'),
      );
      req.user = decoded;
      console.log(req.user);
      return true;
    } catch (err) {
      return false;
    }
  }
}
