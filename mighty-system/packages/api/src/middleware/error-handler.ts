import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  const statusCode = error.statusCode ?? 500;

  const response = {
    success: false,
    error: {
      code: error.code ?? 'INTERNAL_ERROR',
      message: statusCode === 500 ? 'Internal server error' : error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    },
  };

  if (statusCode < 500) {
    request.log.warn({ err: error }, error.message);
  } else {
    request.log.error({ err: error }, error.message);
  }

  reply.status(statusCode).send(response);
}

export class ValidationError extends Error {
  constructor(message: string, public details?: Record<string, unknown>) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = 401;
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Access denied') {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = 403;
  }
}

export class NotFoundError extends Error {
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
    this.statusCode = 409;
  }
}
