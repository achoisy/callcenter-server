import express, { Request, Response } from 'express';
import { validateRequest, configuration, xmlHeader } from '../middlewares/';
import {
  BadRequestError,
  CustomError,
  DatabaseConnectionError,
} from '../errors/';
import { Call } from '../models/call';

const router = express.Router();

// Log incoming call webhook
router.post('/incoming', xmlHeader, async (req, res) => {
  try {
    const {
      CallSid,
      AccountSid,
      CallerCountry,
      Direction,
      CallbackSource,
      CallStatus,
      To,
      From,
      CallDuration,
    } = req.body;

    // Store call in database
    const call = Call.build({
      CallSid,
      AccountSid,
      CallerCountry,
      Direction,
      CallbackSource,
      CallStatus,
      To,
      From,
      CallDuration,
    });

    await call.save();
    res.status(201).send(call);
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    throw new DatabaseConnectionError('Could not add new call');
  }
});

router.post('/outbound', xmlHeader, async (req, res) => {
  console.log(req.body);
  res.status(200).send('OK');
});

export { router as callRouter };
