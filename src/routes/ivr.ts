import express, { NextFunction, Request, Response } from 'express';
import { query } from 'express-validator';
import { validateRequest } from '../middlewares/';
import { twiml } from 'twilio';
import { TaskrouterAttributes, Channel, TaskChannel } from '../interfaces';
import { taskrouterWrapper } from '../services/taskrouter-helper';
import { CustomError } from '../errors';
import { Client } from '../models/client';

const router = express.Router();
//TODO: add token security to ivr routes
router.get('/welcome', async (req, res) => {
  const twimlVoice = new twiml.VoiceResponse();

  const IvrRequestError = (error: string) => {
    console.error(`Ivr Request Error: ${error}`);
    // Error on query object
    twimlVoice.say(
      'Une erreur est survenu dans le traitement de votre demande. Veuillez nous recontacter ulterieurement. Merci.'
    );
    twimlVoice.hangup();
    return res.status(200).send(twimlVoice.toString());
  };

  const gather = twimlVoice.gather({
    input: ['dtmf'],
    action: 'select-service',
    method: 'GET',
    numDigits: 1,
    timeout: 4,
  });
  // Play welcome message
  if (!req.twilio) {
    return IvrRequestError('configuration IVR');
  }
  gather.say(req.twilio.ivr.text);

  twimlVoice.say("Vous n'avez pas fait de choix !");
  twimlVoice.pause({ length: 2 });
  twimlVoice.redirect({ method: 'GET' }, 'welcome');

  res.status(200).send(twimlVoice.toString());
});

router.get(
  '/select-service',
  query('Digits').notEmpty(),
  validateRequest,
  async (req: Request, res: Response) => {
    const twimlVoice = new twiml.VoiceResponse();

    const IvrRequestError = (error: string) => {
      console.error(`Ivr Request Error: ${error}`);
      // Error on query object
      twimlVoice.say(
        'Une erreur est survenu dans le traitement de votre demande. Veuillez nous recontacter ulterieurement. Merci.'
      );
      twimlVoice.hangup();
      return res.status(200).send(twimlVoice.toString());
    };

    if (typeof req.query.Digits !== 'string') {
      return IvrRequestError(`Digits not of type string: ${req.query.Digits}`);
    }

    if (!req.twilio) {
      return IvrRequestError('configuration IVR');
    }

    const digits = parseInt(req.query.Digits);
    const service = req.twilio.ivr.options.find(
      (option) => option.digit == digits
    );

    // User have dailed a wrong service digit
    if (!service) {
      twimlVoice.say('Vous avez fait un choix non valide !');
      twimlVoice.pause({ length: 2 });
      twimlVoice.redirect({ method: 'GET' }, 'welcome');

      return res.status(200).send(twimlVoice.toString());
    }

    const gather = twimlVoice.gather({
      action: `create-task?serviceId=${
        service.id
      }&serviceFriendlyName=${encodeURIComponent(service.friendlyName)}`,
      method: 'GET',
      numDigits: 1,
      timeout: 5,
    });
    gather.say(
      `Appuyer sur une touche pour etre rappelé par le service 
      ${service.friendlyName}, ou patientez sur la ligne.`
    );

    if (typeof req.query.From !== 'string') {
      return IvrRequestError(`From not of type string: ${req.query.From}`);
    }

    const client = await Client.getClientByPhone({
      phone: req.query.From,
    });
    /* create task attributes */
    const attributes: TaskrouterAttributes = {
      clientId: client._id,
      text: `L'appelant a répondu au SVI avec l'option ${service.friendlyName}`,
      channel: Channel.phone,
      phone: req.query.From,
      name: client.name || req.query.From,
      title: 'Appel entrant',
      service: service.friendlyName,
    };

    twimlVoice
      .enqueue({
        workflowSid: taskrouterWrapper.twilioSetup.workflowSid,
      })
      .task({ priority: 1 }, JSON.stringify(attributes));

    res.send(twimlVoice.toString());
  }
);

router.get('/create-task', async (req, res) => {
  const twimlVoice = new twiml.VoiceResponse();

  const IvrRequestError = (error: string) => {
    console.error(`Ivr Request Error: ${error}`);
    // Error on query object
    twimlVoice.say(
      'Une erreur est survenu dans le traitement de votre demande. Veuillez nous recontacter ulterieurement. Merci.'
    );
    twimlVoice.hangup();
    return res.status(200).send(twimlVoice.toString());
  };

  if (!req.twilio) {
    return IvrRequestError('configuration IVR');
  }

  if (typeof req.query.From !== 'string') {
    return IvrRequestError(`From not of type string: ${req.query.From}`);
  }

  if (typeof req.query.serviceFriendlyName !== 'string') {
    return IvrRequestError(
      `ServiceId not of type string: ${req.query.serviceId}`
    );
  }

  const client = await Client.getClientByPhone({
    phone: req.query.From,
  });

  const attributes: TaskrouterAttributes = {
    clientId: client._id,
    title: 'Demande de rappel',
    text: `L'appelant a répondu au SVI avec l'option ${req.query.serviceFriendlyName}`,
    channel: Channel.callback,
    name: client.name || req.query.From,
    service: req.query.serviceFriendlyName,
    phone: req.query.From,
  };

  try {
    await taskrouterWrapper.createTask({
      attributes,
      workflowSid: req.twilio.setup.workflowSid,
      taskChannel: TaskChannel.voice,
    });
    twimlVoice.say(
      'Merci pour votre demande de rappel, un agent va vous recontacter rapidement.'
    );
    twimlVoice.hangup();
    res.status(200).send(twimlVoice.toString());
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    IvrRequestError(`Error in Taskrouter createTask: ${error}`);
  }
});

export { router as ivrRouter };
