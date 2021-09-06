import { env } from '../env-handler';
import { Types } from 'mongoose';
import express, { Request, Response } from 'express';
import { Twilio } from '../services/twilio-helper';
import { body } from 'express-validator';
import { validateRequest, configuration } from '../middlewares/';
import { businessTime } from '../services/business-time';
import { agendaWrapper } from '../services/agenda';
import { Callback } from '../models/callback';
import { Client } from '../models/client';
import { CustomError } from '../errors';
import {
  JobNames,
  TaskrouterAttributes,
  Channel,
  TaskChannel,
} from '../interfaces';

const router = express.Router();

router.post(
  '/devis',
  [body('form').notEmpty().withMessage('form is required')],
  validateRequest,
  configuration,
  async (req: Request, res: Response) => {
    const { form } = req.body;

    if (!req.twilio) {
      throw new Error('missing twilio configuration');
    }

    const opening = businessTime.checkOpening();

    const client = await Client.getClientByPhone({
      name: form.nom,
      phone: form.int_tel,
    });

    const attributes: TaskrouterAttributes = {
      clientId: client._id,
      title: 'Demande de rappel',
      text: 'Demande de devis fait par internet',
      channel: Channel.callback,
      name: client.name || form.nom,
      service: form.service,
      phone: form.int_tel,
      metadata: JSON.stringify(form),
    };

    const taskAttrs = {
      attributes,
      workflowSid: req.twilio.setup.workflowSid,
      taskChannel: TaskChannel.voice,
    };

    try {
      const callback = Callback.build({
        phone: form.int_tel,
        callbackDate: new Date(),
        comment: JSON.stringify(form),
        taskChannel: TaskChannel.voice,
        attributes,
      });
      await callback.save();

      if (opening.isOpen) {
        agendaWrapper.nowTask(callback.id, taskAttrs);
      } else {
        agendaWrapper.scheduleTask(
          opening.nextOpeningTime!,
          callback.id,
          taskAttrs
        );
      }
      console.log('sms to ');
      Twilio.sendSms(
        form.int_tel,
        env.TWILIO_PHONE_NUMBER,
        'Votre demande de rappel a bien été pris en compte. Le service client, HomeSecours.fr'
      );
      res.status(200).send();
    } catch (error) {
      console.error(error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new Error();
    }
  }
);

router.post(
  '/urgence',
  [body('form').notEmpty().withMessage('form is required')],
  validateRequest,
  configuration,
  async (req: Request, res: Response) => {
    const { form } = req.body;

    if (!req.twilio) {
      throw new Error('missing twilio configuration');
    }

    const opening = businessTime.checkOpening();

    const client = await Client.getClientByPhone({
      name: form.nom,
      phone: form.int_tel,
    });

    const attributes: TaskrouterAttributes = {
      clientId: client._id,
      title: 'Demande de rappel URGENT',
      text: 'Demande de rappel urgent fait par internet',
      channel: Channel.callback,
      name: client.name || form.nom,
      service: 'URGENCE',
      phone: form.int_tel,
      metadata: JSON.stringify(form),
    };

    const taskAttrs = {
      attributes,
      workflowSid: req.twilio.setup.workflowSid,
      taskChannel: TaskChannel.voice,
    };

    try {
      const callback = Callback.build({
        phone: form.int_tel,
        callbackDate: new Date(),
        comment: JSON.stringify(form),
        taskChannel: TaskChannel.voice,
        attributes,
      });
      await callback.save();

      if (opening.isOpen) {
        agendaWrapper.nowTask(callback.id, taskAttrs);
      } else {
        // TODO: Definir la procedure hors heure d'ouverture pour les urgences
        agendaWrapper.scheduleTask(
          opening.nextOpeningTime!,
          callback.id,
          taskAttrs
        );
      }

      res.status(200).send();

      Twilio.sendSms(
        form.int_tel,
        env.TWILIO_PHONE_NUMBER,
        'Votre demande de rappel a bien été pris en compte. Le service client, HomeSecours.fr'
      );
    } catch (error) {
      console.error(error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new Error();
    }
  }
);

export { router as publicRouter };
