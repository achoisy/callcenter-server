import { Request, Response, NextFunction } from 'express';

export const xmlHeader = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.set({
    'Content-Type': 'application/xml',
    'Cache-Control': 'public, max-age=0',
  });

  next();
};
