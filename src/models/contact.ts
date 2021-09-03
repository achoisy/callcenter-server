import { Document, Model, model, Schema, Types, PopulatedDoc } from 'mongoose';
import { QueryOptions } from 'mongoose-query-parser';
import { TaskChannel, Channel, TaskrouterAttributes } from '../interfaces';
import { ClientDoc } from './client';
import { UserDoc } from './user';

export interface ContactDoc {
  CallSid: string;
  client?: PopulatedDoc<ClientDoc & Document>;
  taskChannel: TaskChannel;
  channel: Channel;
  attributes: TaskrouterAttributes;
  creator?: PopulatedDoc<UserDoc & Document>;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ContactModel extends Model<ContactDoc> {
  query(queryOptions: QueryOptions): Promise<ContactDoc[]>;
  // build(attrs: ContactDoc): ContactDoc;
}

const contactSchema = new Schema<ContactDoc, ContactModel>(
  {
    contactSid: {
      type: String,
      required: true,
    },
    client: {
      type: 'ObjectId',
      ref: 'Client',
    },
    taskChannel: {
      type: String,
      required: true,
    },
    channel: {
      type: String,
      required: true,
    },
    attributes: {},
    finalComment: {
      type: String,
    },
    creator: {
      type: 'ObjectId',
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
      },
      versionKey: false,
    },
  }
);

/* contactSchema.static('build', function build(attrs: ContactDoc) {
  return new Contact(attrs);
}); */

contactSchema.static('query', function query(queryOptions: QueryOptions) {
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
});

const Contact = model<ContactDoc, ContactModel>('Contact', contactSchema);

export { Contact };
