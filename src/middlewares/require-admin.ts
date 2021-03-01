import { Request, Response, NextFunction } from 'express';
import { NotAuthorizedError } from '../errors/';

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.currentUser || !req.currentUser.admin) {
    throw new NotAuthorizedError();
  }

  next();
};
