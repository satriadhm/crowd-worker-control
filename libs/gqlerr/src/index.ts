/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Catch,
  ArgumentsHost,
  BadRequestException,
  HttpExceptionOptions,
} from '@nestjs/common';
import { GqlExceptionFilter, GqlArgumentsHost } from '@nestjs/graphql';
import { CThrowType, GQLThrowType } from './type';
import { GraphQLFormattedError } from 'graphql';
export * from './type';

// Step 1: Define a custom interface that extends HttpExceptionOptions
interface CustomHttpExceptionOptions extends HttpExceptionOptions {
  type: GQLThrowType;
}

export function GQLErrFormatter(
  err: GraphQLFormattedError,
  anyErr?: unknown,
): GraphQLFormattedError {
  delete err.extensions['code'];
  delete err.extensions['originalError'];
  delete err.extensions['stacktrace'];
  return err;
}

export class ThrowGQL extends BadRequestException {
  public readonly type: GQLThrowType;
  public readonly map: string;

  constructor(message: string, type: GQLThrowType) {
    // Step 2: Use the custom interface when calling super()
    const options: CustomHttpExceptionOptions = { type };
    super(message, options);
    this.type = type;
    this.map = CThrowType[type];
  }
}

@Catch(BadRequestException)
export class CustomGraphQLErrorFilter implements GqlExceptionFilter {
  async catch(exception: BadRequestException, host: ArgumentsHost) {
    // const gqlHost = GqlArgumentsHost.create(host);

    if (exception instanceof ThrowGQL) {
      const type = exception.type;
      const customMessage = exception.message;
      const map = exception.map;
      const newException = new BadRequestException(customMessage);
      delete newException['extensions'];
      newException['extensions'] = {
        type,
        map,
      };
      delete newException['originalError'];
      return newException;
    }

    const translatedMessage = 'Unhandled/Generic Error, please check';
    const newException = new BadRequestException(translatedMessage);
    return newException;
  }
}

class CheckResult<T> {
  constructor(
    public result: T,
    public error: Error | null,
  ) {}

  err(errorMessage: string, errorType: any) {
    if (this.error !== null) {
      // Handle the error, e.g., by throwing a custom error
      throw new ThrowGQL(errorMessage, errorType);
    }
    return this.result;
  }
}

export function Try<T>(fn: () => T): CheckResult<T> {
  try {
    const result = fn();
    return new CheckResult(result, null);
  } catch (error) {
    return new CheckResult(null, error as Error);
  }
}
