import { env } from '../env-handler';
import { Request, Response, NextFunction } from 'express';
import { CustomError, NotAuthorizedError, ReCaptchaError } from '../errors/';
import axios from 'axios';

export const reCaptchaCheck = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  let token: string = '';

  if (req.currentUser) {
    next();
  } else {
    if (!authHeader) {
      throw new NotAuthorizedError();
    }

    const { data } = await axios({
      method: 'post',
      url: env.CAPTCHA_URL,
      params: {
        secret: env.CAPTCHA_KEY,
        response: authHeader,
      },
    });
    const { success } = data;

    if (!success) {
      throw new ReCaptchaError();
    }

    next();
  }
};
