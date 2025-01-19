import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { configService } from 'src/config/config.service';
import { Users } from 'src/users/models/user';

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
      try {
        const decoded = jwt.verify(
          token,
          configService.getEnvValue('SECRET_KEY'),
        );
        req.user = decoded as Users; // Assign decoded token to req.user
      } catch (err) {
        req.user = null;
      }
    }
    console.log('Decoded User:', req.user);
    next();
  }
}
