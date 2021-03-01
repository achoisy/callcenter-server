import express from 'express';
import 'express-async-errors';
import cookieSession from 'cookie-session';
import { json } from 'body-parser';
import { authRouter, ivrRouter } from './routes/';
import { errorHandler, currentUser, configuration } from './middlewares/';
import { NotFoundError } from './errors/';

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

export { app };
