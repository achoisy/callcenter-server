import express from 'express';
import { Contact } from '../models/contact';
import { mongooseQueryParser } from '../middlewares/';
import { CustomError, DatabaseConnectionError } from '../errors';

const router = express.Router();

// Create new contact
router.post('/', async (req, res) => {
  const { CallSid, client, taskChannel, channel, attributes } = req.body;

  if (!req.currentUser) {
    throw new Error('No current user');
  }

  try {
    const contact = new Contact({
      CallSid,
      client,
      taskChannel,
      channel,
      attributes,
    });

    await contact.save();
    res.status(201).send(contact.toJSON());
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    throw new DatabaseConnectionError('Could not create new contact');
  }
});

router.get('/', mongooseQueryParser, async (req, res) => {
  try {
    const contacts = await Contact.query(req.mongoQuery!);
    res.status(201).send(contacts);
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    throw new DatabaseConnectionError('Could not get contact query');
  }
});
