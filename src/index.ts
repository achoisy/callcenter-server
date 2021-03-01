import { loadEnv, env } from './env-handler';
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

  app.listen(env.HTTP_PORT, () => {
    console.log(`Listening on port ${env.HTTP_PORT}`);
  });

  // Gracefull shutdown function
  const stop = async () => {
    console.log('Trying graceful shutdown!');
    await mongoose.disconnect();
    setTimeout(process.exit(0), 2000);
  };

  process.on('SIGINT', () => {
    stop();
  });
  process.on('SIGTERM', () => {
    stop();
  });
};

start();
