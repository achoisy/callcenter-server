import { Request, Response, NextFunction } from 'express';
import { MongooseQueryParser, QueryOptions } from 'mongoose-query-parser';

// Modify @types directly
declare global {
  namespace Express {
    interface Request {
      mongoQuery?: QueryOptions;
    }
  }
}

export const mongooseQueryParser = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  req.mongoQuery = new MongooseQueryParser().parse(req.query);

  next();
};
