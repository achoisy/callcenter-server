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

export class CallbackError extends CustomError {
  statusCode = 400;

  constructor() {
    super('Callback error');

    // Only because extending a built in class
    Object.setPrototypeOf(this, CallbackError.prototype);
  }

  serializeErrors() {
    return [{ message: 'Callbback error' }];
  }
}

export class ClientError extends CustomError {
  statusCode = 400;

  constructor() {
    super('Callback error');

    // Only because extending a built in class
    Object.setPrototypeOf(this, ClientError.prototype);
  }

  serializeErrors() {
    return [{ message: 'Client error' }];
  }
}

export class MeetingError extends CustomError {
  statusCode = 400;

  constructor() {
    super('Meeting error');

    // Only because extending a built in class
    Object.setPrototypeOf(this, MeetingError.prototype);
  }

  serializeErrors() {
    return [{ message: 'Meeting error' }];
  }
}
