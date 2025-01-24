import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { configService } from 'src/config/config.service';
import { Users } from 'src/users/models/user';

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (req.method === 'OPTIONS') {
      return next(); // Skip preflight request
    }
    console.log(`Method: ${req.method}, URL: ${req.url}`);

    let token: string | undefined;

    if (req.headers.authorization) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      console.warn('No token found in Authorization header');
    }

    if (token) {
      try {
        const decoded = jwt.verify(
          token,
          configService.getEnvValue('SECRET_KEY'),
        );
        req.user = decoded as Users;
      } catch (err) {
        console.error('JWT Verification Error:', err.message);
        req.user = null;
      }
    } else {
      console.warn('No token found in Authorization header or cookies');
      req.user = null;
    }

    next();
  }
}
