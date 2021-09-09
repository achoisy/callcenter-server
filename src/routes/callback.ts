import express from 'express';
import { Types } from 'mongoose';
import { Callback } from '../models/callback';
import { Client } from '../models/client';
import { mongooseQueryParser } from '../middlewares/';
import { Channel, TaskChannel, TaskrouterAttributes } from '../interfaces';
import { agendaWrapper } from '../services/agenda';
import { CallbackError, CustomError, DatabaseConnectionError } from '../errors';

const router = express.Router();

// Create new callback
router.post('/', async (req, res) => {
  const {
    callbackDate,
    comment,
    phone,
    name,
    contact_uri = '',
    workflowSid,
  } = req.body;
  if (!req.currentUser) {
    throw new Error('No current user');
  }

  const client = await Client.getClientByPhone({
    name,
    phone,
  });

  const attributes: TaskrouterAttributes = {
    clientId: client._id,
    title: 'Demande de rappel programmé',
    text: `Commentaire: ${comment || 'neant'}. Créé par: ${
      req.currentUser.worker.friendlyName || req.currentUser.email
    }`,
    channel: Channel.callback,
    phone,
    name: client.name || name,
    service: '',
    contact_uri,
    metadata: { comment },
  };

  const taskAttrs = {
    attributes,
    workflowSid,
    taskChannel: TaskChannel.voice,
  };

  try {
    // Add callback to database
    const callback = Callback.build({
      phone,
      callbackDate,
      comment,
      creator: Types.ObjectId(req.currentUser.id),
      taskChannel: TaskChannel.voice,
      attributes,
    });
    await callback.save();

    // Create new scheduleTask
    agendaWrapper.scheduleTask(callbackDate, callback.id, taskAttrs);

    res.send(callback);
  } catch (error) {
    console.error(error);
    if (error instanceof CustomError) {
      throw error;
    }
    throw new DatabaseConnectionError('Could not create new callback');
  }
});

router.get('/', mongooseQueryParser, async (req, res) => {
  try {
    const callback = await Callback.query(req.mongoQuery!);
    res.status(200).send(callback);
  } catch (error) {
    console.error(error);
    if (error instanceof CustomError) {
      throw error;
    }
    throw new DatabaseConnectionError('Could not query callback');
  }
});

router.delete('/:callbackId', async (req, res) => {
  const { callbackId } = req.params;
  try {
    const callback = await Callback.findById(callbackId);

    if (!callback) {
      throw new CallbackError();
    }

    // Remove job from agenda
    await agendaWrapper.cancel(callback.id);

    // Delete job from database
    callback.deleted = true;
    await callback.save();

    res.status(200).send();
  } catch (error) {
    console.error(error);
    if (error instanceof CustomError) {
      throw error;
    }
    throw new DatabaseConnectionError('Could not delete callback');
  }
});

export { router as callbackRouter };
