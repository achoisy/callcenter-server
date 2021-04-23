import { env } from './env-handler';
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
// import bodyParser from 'body-parser';
import 'express-async-errors';
// import cookieSession from 'cookie-session';
import { json, urlencoded } from 'body-parser';
import { authRouter, ivrRouter, workersRouter, phoneRouter } from './routes/';
import {
  errorHandler,
  currentUser,
  configuration,
  requireAuth,
} from './middlewares/';
import { NotFoundError } from './errors/';

const app = express();
app.use(morgan('combined'));
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    // allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept',
    // exposedHeaders: ['set-cookie'],
  })
);
app.set('trust proxy', true);
app.use(json());

// Map parameters to body if not in json format
app.use(
  urlencoded({
    extended: true,
  })
);

/* app.use(
  cookieSession({
    signed: false,
    name: 'session',
    httpOnly: false,
    // secure: process.env.NODE_ENV !== 'test',
  })
); */

// Add id and email of current user if any to req.currentUser
app.use(currentUser);

app.use('/auth', authRouter);

app.use('/workers', requireAuth, workersRouter);
app.use('/phone', requireAuth, phoneRouter);
// app.use('/workers', workersRouter);

// Configuration middleware
// app.use(configuration);

app.use('/ivr', configuration, ivrRouter);

// Not Found route
app.all('*', async (req, res) => {
  throw new NotFoundError();
});

// Error middleware handler
app.use(errorHandler);

export { app };
