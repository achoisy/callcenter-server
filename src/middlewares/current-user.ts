import { Request, Response, NextFunction } from 'express';
import { JWT } from '../services/jwt-helper';
import { UserPayload } from '../interfaces';

// Modify @types directly
declare global {
  namespace Express {
    interface Request {
      currentUser?: UserPayload;
    }
  }
}

export const currentUser = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.session?.jwt) {
    return next();
  }

  try {
    const payload = JWT.verify(req.session.jwt) as UserPayload;
    req.currentUser = payload;
  } catch (err) {}

  next();
};
