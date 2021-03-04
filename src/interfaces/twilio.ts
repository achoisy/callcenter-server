export enum Channel {
  phone = 'phone',
  callback = 'callback',
  chat = 'chat',
  video = 'video',
}

export enum Service {
  default = 'default',
}

export enum activityName {
  offline = 'Offline',
  available = 'Available',
  unavailable = 'Unavailable',
}

export interface Ivr {
  text: string;
  options: [{ friendlyName: string; digit: number; id: string }];
}

export interface TwilioQueue {
  friendlyName: string;
  filterFriendlyName: string;
  id: string;
  taskQueueSid: string;
  expression: string;
  targetWorkerExpression: string;
}

export interface TwilioSetup {
  workerOfflineActivitySid: string;
  workerAvailableActivitySid: string;
  workerUnavailableActivitySid: string;
  callerId: string;
  applicationSid: string;
  workflowSid: string;
  facebookPageId: string;
  voice: {
    recording: boolean;
  };
}

// Twilio configuration setup
export interface TwilioConfiguration {
  ivr: Ivr;
  queues: [TwilioQueue];
  twilio: TwilioSetup;
  default: boolean;
}

export interface TaskrouterAttriutes {
  title: string;
  text: string;
  channel: Channel;
  phone: string;
  name: string;
  service: string;
}

export interface WorkersAttributes {
  name: string;
  channels: Channel[];
  service: Service[];
}

export interface WorkerAttrs {
  workerSid: string;
  friendlyName: string;
  attributes: any;
  activityName: string;
  available: boolean;
}
