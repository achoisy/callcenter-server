import express, { NextFunction, Request, Response } from 'express';
import { query } from 'express-validator';
import { validateRequest } from '../middlewares/';
import { twiml } from 'twilio';
import { TaskrouterAttriutes, Channel } from '../interfaces';
import { Taskrouter } from '../services/taskrouter-helper';

const router = express.Router();
const twimlVoice = new twiml.VoiceResponse();

const IvrChoiceError = (req: Request, res: Response) => {
  // User did not make any choice, redirect to ivr welcome message again.
  twimlVoice.say('Vous avez fait un choix non valide !');
  twimlVoice.pause({ length: 2 });
  twimlVoice.redirect({ method: 'GET' }, 'welcome');

  res.status(200).send(twimlVoice.toString());
};

const IvrRequestError = (error: string, res: Response) => {
  console.error(`Ivr Request Error: ${error}`);
  // Error on query object
  twimlVoice.say(
    'Une erreur est survenu dans le traitement de votre demande. Veuillez nous recontacter ulterieurement. Merci.'
  );
  twimlVoice.hangup();
  return res.status(200).send(twiml.toString());
};

router.get(
  '/welcome',
  async (req, res, next) => {
    const gather = twimlVoice.gather({
      input: ['dtmf'],
      action: 'select-service',
      method: 'GET',
      numDigits: 1,
      timeout: 4,
    });

    // Play welcome message
    gather.say(req.configuration.ivr.text);

    // User did not make any choice, redirect to ivr welcome message again.
    next();
  },
  IvrChoiceError
);

router.get(
  '/select-service',
  query('Digits').notEmpty(),
  validateRequest,
  (req: Request, res: Response, next: NextFunction) => {
    if (typeof req.query.Digits !== 'string') {
      return IvrRequestError(
        `Digits not of type string: ${req.query.Digits}`,
        res
      );
    }

    const digits = parseInt(req.query.Digits);
    const service = req.configuration.ivr.options.find(
      (option) => option.digit == digits
    );

    // User have dailed a wrong service digit
    if (!service) {
      return next();
    }

    const gather = twimlVoice.gather({
      action: `create-task?serviceId=${service.id}
        &serviceFriendlyName=${encodeURIComponent(service.friendlyName)}`,
      method: 'GET',
      numDigits: 1,
      timeout: 5,
    });

    gather.say(
      `Appuyer sur une touche pour etre rappelé par le service 
      ${service.friendlyName}, ou patientez sur la ligne.`
    );

    if (typeof req.query.From !== 'string') {
      return IvrRequestError(`From not of type string: ${req.query.From}`, res);
    }

    /* create task attributes */
    const attributes: TaskrouterAttriutes = {
      text: `L'appelant a répondu au SVI avec l'option ${service.friendlyName}`,
      channel: Channel.phone,
      phone: req.query.From,
      name: req.query.From,
      title: 'Appel entrant',
      service: service.id,
    };

    twimlVoice
      .enqueue({
        workflowSid: req.configuration.twilio.workflowSid,
      })
      .task({ priority: 1, timeout: 3600 }, JSON.stringify(attributes));

    res.send(twimlVoice.toString());
  },
  IvrChoiceError
);

router.get('/create-task', async (req, res) => {
  if (typeof req.query.From !== 'string') {
    return IvrRequestError(`From not of type string: ${req.query.From}`, res);
  }

  if (typeof req.query.serviceId !== 'string') {
    return IvrRequestError(
      `ServiceId not of type string: ${req.query.serviceId}`,
      res
    );
  }

  const attributes: TaskrouterAttriutes = {
    title: 'Demande de rappel',
    text: `L'appelant a répondu au SVI avec l'option ${req.query.serviceFriendlyName}`,
    channel: Channel.callback,
    name: req.query.From,
    service: req.query.serviceId,
    phone: req.query.From,
  };

  const taskrouter = new Taskrouter(req.configuration.twilio);

  try {
    await taskrouter.createTask(attributes);
    twimlVoice.say(
      'Merci pour votre demande de rappel, un agent va vous recontacter rapidement.'
    );
    twimlVoice.hangup();
    res.status(200).send(twiml.toString());
  } catch (error) {
    IvrRequestError(`Error in Taskrouter createTask: ${error}`, res);
  }
});

export { router as ivrRouter };
