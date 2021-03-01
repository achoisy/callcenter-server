import { loadEnv } from './env-handler';
import mongoose from 'mongoose';

// Loading env variables
// Load before importing app
loadEnv();

import { app } from './app';

const start = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/callcenter', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    });
    console.log('Conected to mongodb !');
  } catch (error) {
    console.log(error);
  }

  app.listen(3000, () => {
    console.log('Listening on port 3000');
  });
};

start();
