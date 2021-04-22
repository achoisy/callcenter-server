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

    res.set({
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=0',
    });

    /* if (req.path.includes('/ivr')) {
      res.set({
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=0',
      });
    } else {
      res.set({
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=0',
      });
    } */
  } catch (error) {}

  next();
};
