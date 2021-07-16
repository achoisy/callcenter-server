import { env } from '../env-handler';
import express, { Request, Response } from 'express';
import { Twilio } from '../services/twilio-helper';
import { body } from 'express-validator';
import { validateRequest, configuration } from '../middlewares/';
import { businessTime } from '../services/business-time';
import { agendaWrapper } from '../services/agenda';
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
  (req: Request, res: Response) => {
    const { form } = req.body;

    if (!req.twilio) {
      throw new Error('missing twilio configuration');
    }

    const opening = businessTime.checkOpening();

    const attributes: TaskrouterAttributes = {
      title: 'Demande de rappel',
      text: 'Demande de devis fait par internet',
      channel: Channel.callback,
      name: form.nom,
      service: form.service,
      phone: form.int_tel,
      metadata: form,
    };

    if (opening.isOpen) {
      agendaWrapper.now(JobNames.rappelClientWeb, {
        attributes,
        workflowSid: req.twilio.setup.workflowSid,
        taskChannel: TaskChannel.voice,
      });
    } else {
      console.log(opening.nextOpeningTimeLocal);
      agendaWrapper.schedule(
        opening.nextOpeningTime!,
        JobNames.rappelClientWeb,
        {
          attributes,
          workflowSid: req.twilio.setup.workflowSid,
          taskChannel: TaskChannel.voice,
        }
      );
    }

    res.status(200).send();
    Twilio.sendSms(
      form.int_tel,
      env.TWILIO_PHONE_NUMBER,
      'Votre demande de rappel a bien été pris en compte. Le service client, HomeSecours.fr'
    );
  }
);

router.post(
  '/urgence',
  [body('form').notEmpty().withMessage('form is required')],
  validateRequest,
  (req: Request, res: Response) => {
    const { form } = req.body;

    if (!req.twilio) {
      throw new Error('missing twilio configuration');
    }

    const opening = businessTime.checkOpening();

    const attributes: TaskrouterAttributes = {
      title: 'Demande de rappel URGENT',
      text: 'Demande de rappel urgent fait par internet',
      channel: Channel.callback,
      name: form.nom,
      service: 'URGENCE',
      phone: form.int_tel,
      metadata: form,
    };

    if (opening.isOpen) {
      agendaWrapper.now(JobNames.rappelClientWeb, {
        attributes,
        workflowSid: req.twilio.setup.workflowSid,
        taskChannel: TaskChannel.voice,
      });
    } else {
      // TODO: Definir la procedure hors heure d'ouverture pour les urgences
      console.log(opening.nextOpeningTimeLocal);
      agendaWrapper.schedule(
        opening.nextOpeningTime!,
        JobNames.rappelClientWeb,
        {
          attributes,
          workflowSid: req.twilio.setup.workflowSid,
          taskChannel: TaskChannel.voice,
        }
      );
    }

    res.status(200).send();

    Twilio.sendSms(
      form.int_tel,
      env.TWILIO_PHONE_NUMBER,
      'Votre demande de rappel a bien été pris en compte. Le service client, HomeSecours.fr'
    );
  }
);

export { router as publicRouter };
