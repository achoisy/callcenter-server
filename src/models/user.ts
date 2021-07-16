import mongoose from 'mongoose';
import { Password } from '../services/password';
import { Channel, Service } from '../interfaces';

// An interface that describe proproties neded to create a new user
export interface UserAttrs {
  email: string;
  password: string;
  admin?: boolean;
  worker?: {
    friendlyName?: string;
    attributes?: string;
    workerSid?: string;
  };
}

// Interface that describe propoties a user model have
interface UserModel extends mongoose.Model<UserDoc> {
  build(attrs: UserAttrs): UserDoc;
}

// An interface that describe the propreties that a user have
export interface UserDoc extends mongoose.Document {
  email: string;
  password: string;
  admin: boolean;
  worker?: {
    friendlyName?: string;
    attributes?: string;
    workerSid?: string;
  };
}

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    worker: {
      friendlyName: {
        type: String,
      },
      attributes: String,
      workerSid: {
        type: String,
        unique: true,
        index: true,
      },
    },
    admin: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.password;
      },
      versionKey: false,
    },
  }
);

userSchema.pre('save', async function (done) {
  if (this.isModified('password')) {
    const hashed = await Password.toHash(this.get('password'));
    this.set('password', hashed);
  }
  done();
});

// Only for typescript to work properly
userSchema.statics.build = (attrs: UserAttrs) => {
  return new User(attrs);
};

const User = mongoose.model<UserDoc, UserModel>('User', userSchema);

export { User };
