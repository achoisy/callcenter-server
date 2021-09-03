import express from 'express';
import { mongooseQueryParser } from '../middlewares/';
import { MeetingError, CustomError, DatabaseConnectionError } from '../errors';
import { Meeting } from '../models/meeting';

const router = express.Router();

router.post('/', async (req, res) => {
  const { title, phone, name, address, meetingDate, comment } = req.body;

  try {
    const meeting = Meeting.build({
      title,
      phone,
      name,
      address,
      meetingDate,
      comment,
    });
    await meeting.save();
  } catch (error) {
    console.error(error);
    if (error instanceof CustomError) {
      throw error;
    }
    throw new DatabaseConnectionError('Could not create new meeting');
  }
});

router.get('/', mongooseQueryParser, async (req, res) => {
  try {
    const meeting = await Meeting.query(req.mongoQuery!);
    res.status(200).send(meeting);
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    throw new DatabaseConnectionError('Could not query meeting');
  }
});

router.delete('/:meetingId', async (req, res) => {
  const { meetingId } = req.params;
  try {
    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
      throw new MeetingError();
    }

    meeting.deleted = true;
    await meeting.save();

    res.status(200).send();
  } catch (error) {
    console.error(error);
    if (error instanceof CustomError) {
      throw error;
    }
    throw new DatabaseConnectionError('Could not delete meeting');
  }
});

export { router as meetingRouter };
