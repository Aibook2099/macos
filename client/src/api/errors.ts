export class APIError extends Error {
  constructor(
    public status: number,
    public message: string,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export class ValidationError extends APIError {
  constructor(message: string, details?: any) {
    super(400, message, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends APIError {
  constructor(message: string = 'Authentication failed') {
    super(401, message, 'AUTHENTICATION_ERROR')
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends APIError {
  constructor(message: string = 'Authorization failed') {
    super(403, message, 'AUTHORIZATION_ERROR')
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends APIError {
  constructor(message: string = 'Resource not found') {
    super(404, message, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class ServerError extends APIError {
  constructor(message: string = 'Internal server error') {
    super(500, message, 'SERVER_ERROR')
    this.name = 'ServerError'
  }
} 