import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { configService } from 'src/config/config.service';
import { Users } from 'src/users/models/user';

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.split(' ')[1];
    console.log('Authorization Header:', req.headers.authorization);

    if (token) {
      try {
        const decoded = jwt.verify(
          token,
          configService.getEnvValue('SECRET_KEY'),
        );
        req.user = decoded as Users;
        console.log('Decoded User:', req.user);
      } catch (err) {
        console.error('JWT Verification Error:', err.message);
        req.user = null;
      }
    } else {
      console.warn('Token not found in the Authorization header');
      req.user = null;
    }
    next();
  }
}
