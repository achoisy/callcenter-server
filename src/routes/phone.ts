import express, { Request, Response } from 'express';
import { Twilio } from '../services/twilio-helper';
import { twiml } from 'twilio';
import { body, query } from 'express-validator';
import { validateRequest, configuration, requireAuth } from '../middlewares/';
import { PhoneRouterError, CustomError } from '../errors/';

const router = express.Router();

router.post(
  '/call/:phone',
  [query('taskId').isString().notEmpty(), query('token').isString().notEmpty()],
  validateRequest,
  configuration,
  (req: Request, res: Response) => {
    const { phone } = req.params;
    const { taskId, token } = req.query;

    const twimlVoice = new twiml.VoiceResponse();

    if (!req.twilio) {
      throw new Error('phone call error: missing twilio configuration');
    }

    if (typeof taskId !== 'string') {
      throw new PhoneRouterError('taskId not of type string');
    }

    const dial = twimlVoice.dial({ callerId: req.twilio.setup.callerId });

    dial.conference(
      {
        endConferenceOnExit: true,
        statusCallbackEvent: ['join'],
        statusCallback: `/phone/conference/${taskId}/add-participant/${encodeURIComponent(
          phone
        )}?token=${token}&taskId=${taskId}`,
      },
      taskId
    );

    res.send(twimlVoice.toString());
  }
);

router.post(
  '/conference/:confsid/add-participant/:phone',
  query('taskId').isString().notEmpty(),
  validateRequest,
  (req: Request, res: Response) => {
    const { confsid, phone } = req.params;
    const { taskId } = req.query;

    if (!req.twilio) {
      throw new Error(
        'conference add participant error: missing twilio configuration'
      );
    }

    // Check if conference add-participent request is made by the agent or else
    if (taskId == confsid) {
      // Agent has join, we can now make the call to other party
      try {
        Twilio.createConferenceCall(
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
      res.status(200).end;
    }
  }
);

router.get('/conference/:taskid', (req, res) => {
  try {
    let conferenceSid: string;

    Twilio.getConferenceByName(req.params.taskid)
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

export { router as phoneRouter };
