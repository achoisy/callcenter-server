import jwt from 'jsonwebtoken';

const secretKey = process.env.JWT_KEY || 'asdfhfrHHfuidj'; // add for test purpose

export class JWT {
  static sign(payload: object): string {
    return jwt.sign(payload, secretKey!);
  }
  static verify(token: string): object | string {
    return jwt.verify(token, secretKey!);
  }
}
