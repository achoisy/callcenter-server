import { env } from './env-handler';
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
// import bodyParser from 'body-parser';
import 'express-async-errors';
// import cookieSession from 'cookie-session';
import { json, urlencoded } from 'body-parser';
import {
  authRouter,
  ivrRouter,
  workersRouter,
  phoneRouter,
  publicRouter,
  callRouter,
} from './routes/';
import {
  errorHandler,
  currentUser,
  configuration,
  requireAuth,
  xmlHeader,
  reCaptchaCheck,
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

// Add id and email of current user if any to req.currentUser
app.use(currentUser);

app.use('/api/public', reCaptchaCheck, publicRouter);

app.use('/api/auth', authRouter);

app.use('/api/workers', requireAuth, workersRouter);

app.use('/api/phone', requireAuth, phoneRouter);

app.use('/api/ivr', xmlHeader, configuration, ivrRouter);

app.use('/api/call', requireAuth, callRouter);

// Not Found route
app.all('*', async (req, res) => {
  throw new NotFoundError();
});

// Error middleware handler
app.use(errorHandler);

export { app };
