import { CustomError } from './custom-error';

export class DatabaseConnectionError extends CustomError {
  statusCode = 500;

  constructor(public message: string) {
    super(message);

    // Only because extending a built in class
    Object.setPrototypeOf(this, DatabaseConnectionError.prototype);
  }

  serializeErrors() {
    return [{ message: `Databbase error: ${this.message}` }];
  }
}

export class TaskRouterError extends CustomError {
  statusCode = 400;

  constructor(public message: string) {
    super(message);

    // Only because extending a built in class
    Object.setPrototypeOf(this, TaskRouterError.prototype);
  }

  serializeErrors() {
    return [{ message: `Twilio taskRouter error: ${this.message}` }];
  }
}

export class TwilioClientError extends CustomError {
  statusCode = 400;

  constructor(public message: string) {
    super(message);

    // Only because extending a built in class
    Object.setPrototypeOf(this, TwilioClientError.prototype);
  }

  serializeErrors() {
    return [{ message: `Twilio Client error: ${this.message}` }];
  }
}

export class PhoneRouterError extends CustomError {
  statusCode = 400;

  constructor(public message: string) {
    super(message);

    // Only because extending a built in class
    Object.setPrototypeOf(this, PhoneRouterError.prototype);
  }

  serializeErrors() {
    return [{ message: `Twilio Phone error: ${this.message}` }];
  }
}

export class ReCaptchaError extends CustomError {
  statusCode = 401;

  constructor() {
    super('Invalid ReCaptcha');

    // Only because extending a built in class
    Object.setPrototypeOf(this, ReCaptchaError.prototype);
  }

  serializeErrors() {
    return [{ message: 'Recaptcha error' }];
  }
}
