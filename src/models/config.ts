import mongoose from 'mongoose';
import {
  TwilioConfiguration,
  Ivr,
  TwilioQueue,
  TwilioSetup,
} from '../interfaces';

interface ConfigModel extends mongoose.Model<ConfigDoc> {
  build(attrs: TwilioConfiguration): ConfigDoc;
}

interface ConfigDoc extends mongoose.Document {
  ivr: Ivr;
  queues: [TwilioQueue];
  twilio: TwilioSetup;
  default: boolean;
}

const configSchema = new mongoose.Schema(
  {
    ivr: {
      text: { type: String, required: true },
      options: [{ friendlyName: String, digit: Number, id: String }],
    },
    queues: [
      {
        friendlyName: String,
        filterFriendlyName: String,
        id: String,
        taskQueueSid: String,
        expression: String,
        targetWorkerExpression: String,
      },
    ],
    twilio: {
      workerOfflineActivitySid: String,
      workerAvailableActivitySid: String,
      workerUnavailableActivitySid: String,
      callerId: String,
      applicationSid: String,
      workflowSid: String,
      anyoneWorkflowSid: String,
      someoneWorkflowSid: String,
      facebookPageId: String,
      voice: {
        recording: Boolean,
      },
    },
    default: { type: Boolean, default: false },
  },
  {
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
      },
      versionKey: false,
    },
  }
);

configSchema.statics.build = (attrs: TwilioConfiguration) => {
  return new Config(attrs);
};

const Config = mongoose.model<ConfigDoc, ConfigModel>('Config', configSchema);

export { Config };
