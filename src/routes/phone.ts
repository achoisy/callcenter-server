import express, { Request, Response } from 'express';
import { Twilio } from '../services/twilio-helper';
import { body } from 'express-validator';
import { validateRequest } from '../middlewares/';
import { PhoneRouterError, CustomError } from '../errors/';

const router = express.Router();

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
