import { Document, Model, model, Schema, Types, PopulatedDoc } from 'mongoose';
import { QueryOptions } from 'mongoose-query-parser';

export interface ClientDoc {
  phone?: string;
  name?: string;
  company?: string;
  email?: string;
  address?: string;
  comment?: string;
  createdAt?: Date;
  updatedAt?: Date;
  _id?: string;
}

interface ClientModel extends Model<ClientDoc> {
  query(queryOptions: QueryOptions): Promise<ClientDoc[]>;
  getClientByPhone(client: ClientDoc): Promise<ClientDoc>;
}

const clientSchema = new Schema<ClientDoc, ClientModel>(
  {
    phone: { type: String },
    name: { type: String },
    company: { type: String },
    email: { type: String },
    address: { type: String },
    comment: { type: String },
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

clientSchema.statics.getClientByPhone = async (client: ClientDoc) => {
  const clientResult = await Client.findOne({ phone: client.phone }).exec();

  // Check if client with matching phone number exist
  // If not create a new client and return created id
  if (!clientResult) {
    const newClient = new Client(client);
    await newClient.save();
    return newClient;
  }
  return clientResult;
};

const Client = model<ClientDoc, ClientModel>('Client', clientSchema);

export { Client };
