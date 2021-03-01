import { env } from '../env-handler';
import jwt from 'jsonwebtoken';

const secretKey = env.JWT_KEY; // add for test purpose

export class JWT {
  static sign(payload: object): string {
    return jwt.sign(payload, secretKey!);
  }
  static verify(token: string): object | string {
    return jwt.verify(token, secretKey!);
  }
}
