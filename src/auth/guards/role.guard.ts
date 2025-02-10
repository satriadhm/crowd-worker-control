import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ThrowGQL, GQLThrowType } from '@app/gqlerr';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    const ctx = GqlExecutionContext.create(context).getContext();
    const req = ctx.req;
    const user = req.user;

    if (!requiredRoles) {
      return true;
    }
    if (!user || !user.role) {
      throw new ThrowGQL('Unauthorized', GQLThrowType.NOT_AUTHORIZED);
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ThrowGQL('Wrong Role', GQLThrowType.FORBIDDEN);
    }

    return true;
  }
}
