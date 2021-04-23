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
  let token: string = '';

  // API twilio request auth process
  const regex = /^\/apitoken\/.*/;
  if (regex.test(req.url)) {
    req.query.token = req.url.split('/')[2];
    req.url = req.url.split(`/apitoken/${req.query.token}`)[1];
  }

  // We can pass the token either thru headers or thru query params ?token=xxxxxx
  if (!authHeader) {
    token = req.query.token ? String(req.query.token) : '';
  } else {
    token = authHeader && authHeader.split(' ')[1];
  }

  if (!token) {
    return next();
  }

  try {
    const payload = JWT.verify(token) as UserPayload;

    if (!payload.id) {
      return next();
    }

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
      token: token,
    };
  } catch (err) {}

  next();
};
