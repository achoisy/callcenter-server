import mongoose from 'mongoose';
import { QueryOptions } from 'mongoose-query-parser';

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
  query(queryOptions: QueryOptions): Promise<CallDoc[]>;
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
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret._id;
      },
      versionKey: false,
    },
  }
);

// Only for typescript to work properly
callSchema.statics.build = (attrs: CallAttrs) => {
  return new Call(attrs);
};

callSchema.statics.query = (queryOptions: QueryOptions) => {
  let chain = Call.find(queryOptions.filter || {});
  if (queryOptions.populate) {
    chain = chain.populate(queryOptions.populate);
  }
  if (queryOptions.sort) {
    chain = chain.sort(queryOptions.sort);
  }
  if (queryOptions.limit) {
    chain = chain.limit(queryOptions.limit);
  }
  if (queryOptions.skip) {
    chain = chain.skip(queryOptions.skip);
  }
  if (queryOptions.select) {
    chain = chain.select(queryOptions.select);
  }

  return chain.exec();
};

const Call = mongoose.model<CallDoc, CallModel>('Call', callSchema);

export { Call };
