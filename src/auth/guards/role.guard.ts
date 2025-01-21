import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GQLThrowType, ThrowGQL } from '@app/gqlerr';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const user = req.user;
    console.log(user);

    if (!user || !requiredRoles.includes(user.role)) {
      throw new ThrowGQL('Forbidden', GQLThrowType.FORBIDDEN);
    }

    return true;
  }
}
