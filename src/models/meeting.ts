import { Document, Model, model, Schema } from 'mongoose';
import { QueryOptions } from 'mongoose-query-parser';

export interface MeetingAttrs {
  title: string;
  phone: string;
  name?: string;
  address?: string;
  meetingDate: Date;
  comment?: string;
}

export interface MeetingDoc extends MeetingAttrs, Document {
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  deleting(): MeetingDoc;
}

interface MeetingModel extends Model<MeetingDoc> {
  build(attrs: MeetingAttrs): MeetingDoc;
  query(queryOptions: QueryOptions): Promise<MeetingDoc[]>;
}

const meetingSchema = new Schema<MeetingDoc, MeetingModel>(
  {
    title: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    name: {
      type: String,
    },
    address: {
      type: String,
    },
    meetingDate: {
      type: Date,
      required: true,
    },
    comment: {
      type: String,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

meetingSchema.methods.deleting = async function (this: MeetingDoc) {
  this.deleted = true;
  await this.save();
  return this;
};

meetingSchema.statics.build = (attrs: MeetingAttrs) => {
  return new Meeting(attrs);
};

meetingSchema.statics.query = function (queryOptions: QueryOptions) {
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

const Meeting = model<MeetingDoc, MeetingModel>('Meeting', meetingSchema);

export { Meeting };
