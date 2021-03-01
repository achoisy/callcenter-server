import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

// Convert scrypt callback to async function
const scryptAsync = promisify(scrypt);

export class Password {
  // Use of 'static': direct use on toHash function without the need to create'new Password'
  static async toHash(password: string) {
    const salt = randomBytes(8).toString('hex');
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;

    return `${buf.toString('hex')}.${salt}`;
  }
  static async compare(storedPassword: string, suppliedPassword: string) {
    const [hashedPassword, salt] = storedPassword.split('.');
    const buf = (await scryptAsync(suppliedPassword, salt, 64)) as Buffer;

    return buf.toString('hex') === hashedPassword;
  }
}
