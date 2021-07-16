import express, { Request, Response } from 'express';
import { xmlHeader, mongooseQueryParser } from '../middlewares/';
import { CustomError, DatabaseConnectionError } from '../errors/';
import { Call } from '../models/call';

const router = express.Router();

// Log incoming call webhook
router.post('/', xmlHeader, async (req, res) => {
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
    res.status(201).send('OK');
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    throw new DatabaseConnectionError('Could not add new call');
  }
});

// Get calls buy query string
router.get('/', mongooseQueryParser, async (req, res) => {
  try {
    const calls = await Call.query(req.mongoQuery!);
    res.status(200).send(calls);
  } catch (error) {
    //TODO: Create error handler
    console.log(error);
  }
});

export { router as callRouter };
