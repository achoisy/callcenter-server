import express, { Request, Response } from 'express';
import { Twilio } from '../services/twilio-helper';
import { twiml } from 'twilio';
import { body } from 'express-validator';
import { taskrouterWrapper } from '../services/taskrouter-helper';
import { validateRequest, configuration, xmlHeader } from '../middlewares/';
import { PhoneRouterError, TaskRouterError, CustomError } from '../errors/';
import { TaskrouterAttributes, Channel, TaskChannel } from '../interfaces';

const router = express.Router();

router.post(
  '/call/:phone',
  [body('CallSid').isString().notEmpty()],
  validateRequest,
  xmlHeader,
  configuration,
  (req: Request, res: Response) => {
    const { phone } = req.params;
    const { CallSid } = req.body;
    const token = req.currentUser!.token;
    const reservation = req.query.reservation
      ? String(req.query.reservation)
      : '';

    const twimlVoice = new twiml.VoiceResponse();

    if (!req.twilio) {
      throw new Error('phone call error: missing twilio configuration');
    }

    twimlVoice.say('Nous recherchons votre correspondant, veuillez patienter.');
    const dial = twimlVoice.dial({ callerId: req.twilio.setup.callerId });

    dial.conference(
      {
        endConferenceOnExit: true,
        statusCallbackEvent: ['join'],
        statusCallback: `/api/phone/conference/${CallSid}/add-participant/${encodeURIComponent(
          phone
        )}?token=${token}&reservation=${reservation}`,
      },
      String(CallSid)
    );

    res.send(twimlVoice.toString());
  }
);

router.post(
  '/conference/:confsid/add-participant/:phone',
  body('CallSid').isString().notEmpty(),
  validateRequest,
  configuration,
  (req: Request, res: Response) => {
    const { confsid, phone } = req.params;
    const { CallSid } = req.body;
    const reservation = req.query.reservation
      ? String(req.query.reservation)
      : '';

    if (!req.twilio) {
      throw new Error(
        'conference add participant error: missing twilio configuration'
      );
    }

    // Check if conference add-participent request is made by the agent or else
    if (CallSid == confsid) {
      // Agent has join, we can now make the call to other party
      try {
        Twilio.addParticipantToConference(
          confsid,
          req.twilio.setup.callerId,
          phone
        ).then((participant) => {
          res.status(200).end();
        });
      } catch (error) {
        if (error instanceof CustomError) {
          throw error;
        }
        throw new Error(error);
      }
    } else {
      // User as join the call. Accept reservation for initial worker
      if (reservation) {
        Twilio.reservationUpdate(
          req.currentUser?.worker.workerSid!,
          reservation,
          { reservationStatus: 'accepted' }
        );
      }
      res.status(200).end();
    }
  }
);

router.get('/conference/:confsid', (req, res) => {
  try {
    let conferenceSid: string;

    Twilio.getConferenceByName(req.params.confsid)
      .then((conference) => {
        conferenceSid = conference.sid;
        return Twilio.getConferenceParticipants(conference.sid);
      })
      .then((participants) => {
        res.send({
          conference: {
            sid: conferenceSid,
            participants: participants,
          },
        });
      });
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    throw new Error(error);
  }
});

router.post(
  '/hold',
  [
    body('conferenceSid')
      .isString()
      .notEmpty()
      .withMessage('Must provide conferenceSid'),
    body('callSid').isString().notEmpty().withMessage('Must provide callSid'),
    body('hold')
      .isBoolean()
      .notEmpty()
      .withMessage('Must provide hold as boolean'),
  ],
  validateRequest,
  (req: Request, res: Response) => {
    const { conferenceSid, callSid, hold } = req.body;
    try {
      Twilio.setConferenceParticipantHold(conferenceSid, callSid, hold).then(
        (participant) => {
          res.send({
            participant,
          });
        }
      );
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new Error(error);
    }
  }
);

router.post('/create-task-call/:phone', configuration, async (req, res) => {
  const { phone } = req.params;
  const contact_uri = `client:${req.currentUser?.worker.friendlyName}`;

  if (!req.twilio) {
    throw new TaskRouterError('Missing twilio config setup...');
  }

  const attributes: TaskrouterAttributes = {
    title: 'Appel sortant',
    text: `Appel du numero: ${phone}`,
    channel: Channel.call,
    name: phone,
    service: '',
    phone: phone,
    contact_uri,
  };

  try {
    const newTask = await taskrouterWrapper.createTask({
      attributes,
      worflowSid: req.twilio.setup.someoneWorkflowSid,
      timeout: 3600,
      taskChannel: TaskChannel.voice,
    });

    res.status(200).send(newTask);
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    throw new TaskRouterError(`Failed to create task call: ${error}`);
  }
});

export { router as phoneRouter };
