import { Document, Model, model, Schema, Types } from 'mongoose';
import { QueryOptions } from 'mongoose-query-parser';
import { TaskChannel, TaskrouterAttributes } from '../interfaces';
import { UserDoc } from './user';

export interface CallbackAttrs {
  phone: string;
  creator?: Types.ObjectId | Record<string, unknown>;
  callbackDate: Date;
  comment: string;
  taskChannel: TaskChannel;
  attributes: TaskrouterAttributes;
}

interface CallbackBaseDoc extends CallbackAttrs, Document {
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  deleting(): CallbackDoc;
}

export interface CallbackDoc extends CallbackBaseDoc {
  creator?: UserDoc['_id'];
}

export interface CallbackPopulatedDoc extends CallbackBaseDoc {
  company: UserDoc;
}

interface CallbackModel extends Model<CallbackDoc> {
  build(attrs: CallbackAttrs): CallbackDoc;
  query(queryOptions: QueryOptions): Promise<CallbackDoc[]>;
}

const callbackSchema = new Schema<CallbackDoc, CallbackModel>(
  {
    phone: {
      type: String,
      required: true,
    },
    comment: String,
    callbackDate: {
      type: Date,
      required: true,
    },
    taskChannel: {
      type: String,
      required: true,
    },
    attributes: {},
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    deleted: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

callbackSchema.methods.deleting = async function (this: CallbackDoc) {
  this.deleted = true;
  await this.save();
  return this;
};

callbackSchema.statics.build = (attrs: CallbackAttrs) => {
  return new Callback(attrs);
};

callbackSchema.statics.query = function (queryOptions: QueryOptions) {
  let chain = this.find(queryOptions.filter || {});
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

const Callback = model<CallbackDoc, CallbackModel>('Callback', callbackSchema);

export { Callback };
