import { Request, Response, NextFunction } from 'express';
import { TwilioConfiguration } from '../interfaces';
import { Config } from '../models/config';
import { DatabaseConnectionError } from '../errors/';

// Modify @types directly
declare global {
  namespace Express {
    interface Request {
      configuration: TwilioConfiguration;
    }
  }
}

export const configuration = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const configuration = await Config.findOne({ default: true });

    if (!configuration) {
      throw new DatabaseConnectionError(
        "Can't get configuration setup from database"
      );
    }
    req.configuration = configuration;
  } catch (error) {}

  next();
};
