import { loadEnv, env } from './env-handler';
import mongoose from 'mongoose';
import { Config } from './models/config';
import http from 'http';
import https from 'https';
import fs from 'fs';

// Loading env variables
// Load before importing app
loadEnv();

import { app } from './app';
import { taskrouterWrapper } from './services/taskrouter-helper';

const start = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/callcenter', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    });
    console.log('Conected to mongodb !');

    // Setting up twilio config ----
    const config = await Config.findOne({ default: true });

    if (!config?.twilio) {
      throw new Error("Can't get configuration setup from database");
    }

    taskrouterWrapper.config(config.twilio);
    //-------------------------------
  } catch (error) {
    console.log(error);
  }

  if (env.NODE_ENV == 'production') {
    const httpServer = http.createServer(app);
    const httpsServer = https.createServer(
      {
        key: fs.readFileSync(env.SSL_PRIVKEY_PEM),
        cert: fs.readFileSync(env.SSL_FULLCHAIN_PEM),
      },
      app
    );

    httpServer.listen(env.HTTP_PORT, () => {
      console.log(`Production mode: Listening on port ${env.HTTP_PORT}`);
    });

    httpsServer.listen(env.HTTPS_PORT, () => {
      console.log(`Production mode: Listening on port ${env.HTTPS_PORT}`);
    });
  } else {
    app.listen(env.HTTP_PORT, () => {
      console.log(`Devloppement mode: Listening on port ${env.HTTP_PORT}`);
    });
  }

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
