import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';
import { User } from '../models/User';

export interface AuthRequest extends Request {
  user?: User;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        status: 'error',
        message: 'No token provided',
        error: {
          code: 'NO_TOKEN',
          details: 'Authorization header is required',
        },
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token format',
        error: {
          code: 'INVALID_TOKEN_FORMAT',
          details: 'Token should be in format: Bearer <token>',
        },
      });
    }

    const decoded = verifyToken(token);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'User not found',
        error: {
          code: 'USER_NOT_FOUND',
          details: 'User associated with token no longer exists',
        },
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token',
      error: {
        code: 'INVALID_TOKEN',
        details: 'Token is invalid or expired',
      },
    });
  }
}; 