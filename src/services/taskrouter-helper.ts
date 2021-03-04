import { env } from '../env-handler';
import twilio from 'twilio';
import {
  TaskrouterAttriutes,
  TwilioSetup,
  WorkersAttributes,
  Channel,
  Service,
  WorkerAttrs,
} from '../interfaces';
import { TaskRouterError, CustomError } from '../errors/';
import { WorkerInstance } from 'twilio/lib/rest/taskrouter/v1/workspace/worker';

const twilioClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN, {
  accountSid: env.TWILIO_ACCOUNT_SID,
});

class Taskrouter {
  private _twilioSetup?: TwilioSetup;

  get twilioSetup() {
    if (!this._twilioSetup) {
      throw new Error('Cannot access Taskrouter before configuration');
    }
    return this._twilioSetup;
  }

  config(configuration: TwilioSetup) {
    this._twilioSetup = configuration;
  }

  defaultAttributes(name: string): WorkersAttributes {
    return {
      name,
      channels: [Channel.phone, Channel.callback],
      service: [Service.default],
    };
  }

  workerToJSON(workerAttrs: WorkerInstance): WorkerAttrs {
    return {
      workerSid: workerAttrs.sid,
      friendlyName: workerAttrs.friendlyName,
      attributes: JSON.parse(workerAttrs.attributes),
      activityName: workerAttrs.activityName,
      available: workerAttrs.available,
    };
  }
  // Create a new task in twilio taskrouter for specified callcenter
  async createTask(attributes: TaskrouterAttriutes) {
    try {
      const payload = {
        workflowSid: this.twilioSetup.workflowSid,
        attributes: JSON.stringify(attributes),
        timeout: 3600,
        taskChannel: 'voice',
      };
      const newTask = await twilioClient.taskrouter
        .workspaces(env.TWILIO_WORKSPACE_SID)
        .tasks.create(payload);

      return newTask;
    } catch (error) {
      throw new TaskRouterError('Unable to create new task');
    }
  }

  // Create new worker and return worker object
  async createWorker(friendlyName: string) {
    try {
      const worker = await twilioClient.taskrouter
        .workspaces(env.TWILIO_WORKSPACE_SID)
        .workers.create({
          friendlyName,
          attributes: JSON.stringify(this.defaultAttributes(friendlyName)),
        });

      return worker;
    } catch (error) {
      throw new TaskRouterError('Unable to create new worker');
    }
  }

  // Return list of workers
  async getWorkers(): Promise<WorkerAttrs[]> {
    try {
      const payload = await twilioClient.taskrouter
        .workspaces(env.TWILIO_WORKSPACE_SID)
        .workers.list();

      return payload.map((worker) => {
        return this.workerToJSON(worker);
      });
    } catch (error) {
      throw new TaskRouterError('Unable to get workers list');
    }
  }

  async getWorkerBySid(workerSid: string): Promise<WorkerAttrs> {
    try {
      const worker = await twilioClient.taskrouter
        .workspaces(env.TWILIO_WORKSPACE_SID)
        .workers(workerSid)
        .fetch();

      return this.workerToJSON(worker);
    } catch (error) {
      throw new TaskRouterError(
        `worker with SID: ${workerSid} not found or unreachable`
      );
    }
  }

  // Delete workker by SID
  async deleteWorker(workerSid: string) {
    return new Promise(async (resolve, reject) => {
      try {
        const selectWorker = await this.getWorkerBySid(workerSid);
        twilioClient.taskrouter
          .workspaces(env.TWILIO_WORKSPACE_SID)
          .workers(selectWorker.workerSid)
          .remove(() => {
            resolve(null);
          });
      } catch (error) {
        if (error instanceof CustomError) {
          reject(error);
        } else {
          reject(new TaskRouterError(`worker deletion cause error`));
        }
      }
    });
  }
}

export const taskrouterWrapper = new Taskrouter();
