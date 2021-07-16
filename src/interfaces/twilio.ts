export enum Channel {
  phone = 'phone', // Incoming call
  callback = 'callback',
  chat = 'chat',
  video = 'video',
  call = 'call', // Outgoing call
}

export enum TaskChannel {
  default = 'default',
  voice = 'voice',
  chat = 'chat',
  sms = 'sms',
  video = ' video',
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
  anyoneWorkflowSid: string;
  someoneWorkflowSid: string;
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

export interface TaskrouterAttributes {
  title: string;
  text: string;
  channel: Channel;
  phone: string;
  name: string;
  service: string;
  contact_uri?: string;
  metadata?: any;
}

export interface WorkersAttributes {
  name: string;
  channels: Channel[];
  service: Service[];
  contact_uri: string;
}

export interface WorkerAttrs {
  workerSid: string;
  friendlyName: string;
  attributes: any;
  activityName: string;
  available: boolean;
}

export interface WorkspacePolicyOptions {
  resources?: string[];
  method?: string;
}

export interface ConferenceParticipant {
  callSid: string;
  label: string;
}

export interface TaskAttrs {
  attributes: TaskrouterAttributes;
  workflowSid: string;
  taskChannel: TaskChannel;
}
