import { Request, Response, NextFunction } from 'express';
import { Ivr, TwilioSetup } from '../interfaces';
import { Config } from '../models/config';
import { DatabaseConnectionError } from '../errors/';

// Modify @types directly
declare global {
  namespace Express {
    interface Request {
      twilio?: {
        ivr: Ivr;
        setup: TwilioSetup;
      };
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

    if (!configuration?.ivr) {
      throw new DatabaseConnectionError(
        "Can't get configuration setup from database"
      );
    }

    req.twilio = {
      ivr: configuration.ivr,
      setup: configuration.twilio,
    };
  } catch (error) {}

  next();
};
