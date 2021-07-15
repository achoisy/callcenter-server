import mongoose from 'mongoose';

// An interface that describe proproties neded to create a new call
interface CallAttrs {
  CallSid: string;
  ConfSid?: string;
  AccountSid: string;
  CallerCountry: string;
  Direction: string;
  CallbackSource: string;
  CallStatus: string;
  To: string;
  From: string;
  CallDuration: number;
}

interface CallDoc extends mongoose.Document {
  CallSid: string;
  AccountSid: string;
  CallerCountry: string;
  Direction: string;
  CallbackSource: string;
  CallStatus: string;
  To: string;
  From: string;
  CallDuration: number;
  createdAt: Date;
  updatedAt: Date;
}

// Interface that describe propoties a user model have
interface CallModel extends mongoose.Model<CallDoc> {
  build(attrs: CallAttrs): CallDoc;
}

const callSchema = new mongoose.Schema(
  {
    CallSid: {
      type: String,
    },
    ConfSid: {
      type: String,
    },
    AccountSid: {
      type: String,
    },
    CallerCountry: {
      type: String,
    },
    Direction: {
      type: String,
    },
    CallbackSource: {
      type: String,
    },
    CallStatus: {
      type: String,
    },
    To: {
      type: String,
    },
    From: {
      type: String,
    },
    CallDuration: {
      type: Number,
    },
  },
  { timestamps: true }
);

// Only for typescript to work properly
callSchema.statics.build = (attrs: CallAttrs) => {
  return new Call(attrs);
};

const Call = mongoose.model<CallDoc, CallModel>('Call', callSchema);

export { Call };
