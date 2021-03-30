import { Request, Response, NextFunction } from 'express';
import { JWT } from '../services/jwt-helper';
import { UserPayload } from '../interfaces';
import { User } from '../models/user';

// Modify @types directly
declare global {
  namespace Express {
    interface Request {
      currentUser?: UserPayload;
    }
  }
}

export const currentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return next();
  }

  try {
    const payload = JWT.verify(token) as UserPayload;
    const currentUser = await User.findOne({ _id: payload.id });

    if (!currentUser) {
      return next();
    }

    req.currentUser = {
      id: payload.id,
      email: payload.email,
      admin: currentUser.admin,
      worker: {
        workerSid: currentUser.worker?.workerSid,
        friendlyName: currentUser.worker?.friendlyName,
        attributes: JSON.parse(currentUser.worker?.attributes || ''),
      },
    };
  } catch (err) {}

  next();
};
