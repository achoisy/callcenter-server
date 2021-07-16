import mongoose from 'mongoose';
import { QueryOptions } from 'mongoose-query-parser';

interface ClientAttrs {
  phone: string;
  name?: string;
  company?: string;
  email?: string;
  address?: string;
}

interface ClientDoc extends mongoose.Document {
  phone: string;
  name?: string;
  company?: string;
  email?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ClientModel extends mongoose.Model<ClientDoc> {
  build(attrs: ClientAttrs): ClientDoc;
  query(queryOptions: QueryOptions): Promise<ClientDoc[]>;
}

const clientSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      unique: true,
      required: true,
    },
    name: { type: String },
    company: { type: String },
    email: { type: String },
    address: { type: String },
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

clientSchema.statics.build = (attrs) => {
  return new Client(attrs);
};

clientSchema.statics.query = (queryOptions: QueryOptions) => {
  let chain = Client.find(queryOptions.filter || {});
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

const Client = mongoose.model<ClientDoc, ClientModel>('Client', clientSchema);

export { Client };
