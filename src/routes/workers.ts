import express, { Request, Response } from 'express';
import { validateRequest } from '../middlewares/';
import { body } from 'express-validator';
import { User } from '../models/user';
import {
  BadRequestError,
  TaskRouterError,
  DatabaseConnectionError,
  CustomError,
} from '../errors/';
import { taskrouterWrapper } from '../services/taskrouter-helper';

const router = express.Router();

// Create a new worker
// If email in database, link it to user
router.post(
  '/',
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
          existingUser.friendlyName = worker.friendlyName;
          existingUser.workerSid = worker.sid;
          existingUser.attributes = worker.attributes;
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
router.get('/:workersid', async (req, res) => {
  const worker = await taskrouterWrapper.getWorkerBySid(req.params.workersid);
  if (!worker) {
    throw new TaskRouterError(
      `worker with SID: ${req.params.workersid} not found`
    );
  }
  res.send(worker);
});

// Get a worker list
router.get('/', async (req, res) => {
  const workersList = await taskrouterWrapper.getWorkers();
  if (!workersList) {
    throw new TaskRouterError(`workers list not found`);
  }
  res.send(workersList);
});

// Update worker

// Delete worker from twilio and database
router.delete('/:workersid', async (req, res) => {
  try {
    await taskrouterWrapper.deleteWorker(req.params.workersid);
    const removeWorker = await User.findOne({
      workerSid: req.params.workersid,
    });
    if (removeWorker) {
      removeWorker.friendlyName = undefined;
      removeWorker.workerSid = undefined;
      removeWorker.attributes = undefined;
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

      user.friendlyName = worker.friendlyName;
      user.workerSid = worker.workerSid;
      user.attributes = JSON.stringify(worker.attributes);
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

export { router as workersRouter };
