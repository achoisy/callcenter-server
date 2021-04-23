import { WorkersAttributes } from './';

export interface UserPayload {
  id: string;
  email: string;
  admin: boolean;
  worker: {
    workerSid?: string;
    friendlyName?: string;
    attributes?: WorkersAttributes;
  };
  token: string;
}
