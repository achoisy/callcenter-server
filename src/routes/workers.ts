import express, { Request, Response } from 'express';
import { validateRequest, requireAdmin } from '../middlewares/';
import { body } from 'express-validator';
import { User } from '../models/user';
import {
  BadRequestError,
  TaskRouterError,
  DatabaseConnectionError,
  CustomError,
} from '../errors/';
import { taskrouterWrapper } from '../services/taskrouter-helper';
import { Twilio } from '../services/twilio-helper';

const router = express.Router();

// Create a new worker
// If email in database, link it to user
router.post(
  '/',
  requireAdmin,
  [
    body('name')
      .trim()
      .isLength({ min: 3, max: 25 })
      .withMessage('name est requis'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { email, name } = req.body;
    try {
      const worker = await taskrouterWrapper.createWorker(name);
      if (!worker) {
        throw new TaskRouterError('Could not create worker...');
      }

      // If user exist in database link worker to user
      if (email) {
        const existingUser = await User.findOne({ email });

        if (existingUser) {
          existingUser.worker = {
            friendlyName: worker.friendlyName,
            workerSid: worker.sid,
            attributes: worker.attributes,
          };
          await existingUser.save();
        }
      }

      res.send(taskrouterWrapper.workerToJSON(worker));
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new DatabaseConnectionError('Could not add new worker');
    }
  }
);

// Get a worker by Id
router.get('/:workersid', requireAdmin, async (req, res) => {
  const worker = await taskrouterWrapper.getWorkerBySid(req.params.workersid);
  if (!worker) {
    throw new TaskRouterError(
      `worker with SID: ${req.params.workersid} not found`
    );
  }
  res.send(worker);
});

// Get a worker list
router.get('/', requireAdmin, async (req, res) => {
  const workersList = await taskrouterWrapper.getWorkers();
  if (!workersList) {
    throw new TaskRouterError(`workers list not found`);
  }
  res.send(workersList);
});

// Update worker

// Delete worker from twilio and database
router.delete('/:workersid', requireAdmin, async (req, res) => {
  try {
    await taskrouterWrapper.deleteWorker(req.params.workersid);
    const removeWorker = await User.findOne({
      workerSid: req.params.workersid,
    });
    if (removeWorker) {
      removeWorker.worker = {
        friendlyName: undefined,
        workerSid: undefined,
        attributes: undefined,
      };
      await removeWorker.save();
    }
    res.status(200).send();
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    throw new DatabaseConnectionError(`Worker deletion: ${error}`);
  }
});

// link worker with existing user in database
router.post(
  '/link',
  requireAdmin,
  [
    body('email').isEmail().withMessage('email est requis'),
    body('workerSid').notEmpty().withMessage('workerSid est requis'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { email, workerSid } = req.body;
    // Get worker info
    try {
      const existingUser = await User.findOne({ workerSid });

      if (existingUser) {
        throw new BadRequestError('workerSid already link to a user...');
      }

      const worker = await taskrouterWrapper.getWorkerBySid(workerSid);
      if (!worker) {
        throw new BadRequestError('Invalid workerSid');
      }

      const user = await User.findOne({ email });
      if (!user) {
        throw new BadRequestError('Invalid Email');
      }

      user.worker = {
        friendlyName: worker.friendlyName,
        workerSid: worker.workerSid,
        attributes: JSON.stringify(worker.attributes),
      };
      await user.save();

      res.status(200).send();
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new DatabaseConnectionError(
        `Faild to join worker with user: ${error}`
      );
    }
  }
);

// return worker with access token and capability token
router.post(
  '/tokens',
  [
    body('applicationSid').notEmpty().withMessage('applicationSid est requis'),
    body('endpointId').notEmpty().withMessage('endpointId est requis'),
  ],
  validateRequest,
  (req: Request, res: Response) => {
    const { applicationSid, endpointId } = req.body;

    if (
      !req.currentUser?.worker.workerSid ||
      !req.currentUser?.worker.friendlyName
    ) {
      throw new BadRequestError('WorkerSid or friendlyName not defined');
    }

    const { workerSid, friendlyName } = req.currentUser.worker;

    // Add tokens to user session
    const tokens = {
      access: Twilio.createAccessToken(
        applicationSid,
        friendlyName,
        endpointId
      ),
      capability: taskrouterWrapper.createWorkerTokens(workerSid),
    };

    res.send({ tokens });
  }
);

router.get('/conference/:taskid', async (req, res) => {
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

export { router as workersRouter };
