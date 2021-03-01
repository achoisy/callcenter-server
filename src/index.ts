import express from 'express';
import 'express-async-errors';
import cookieSession from 'cookie-session';
import { json } from 'body-parser';
import { authRouter, ivrRouter } from './routes/';
import { errorHandler, currentUser, configuration } from './middlewares/';
import { NotFoundError } from './errors/';
import mongoose from 'mongoose';

// Check for env before starting service
require('dotenv').config();
import './env-check';

const app = express();
// app.set('trust proxy', true)
app.use(json());
app.use(
  cookieSession({
    signed: false,
    // secure: process.env.NODE_ENV !== 'test',
  })
);

// Add id and email of current user if any to req.currentUser
app.use(currentUser);

app.use('/auth', authRouter);

// Configuration middleware
app.use(configuration);

app.use('ivr', ivrRouter);

// Not Found route
app.all('*', async (req, res) => {
  throw new NotFoundError();
});

// Error middleware handler
app.use(errorHandler);

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
