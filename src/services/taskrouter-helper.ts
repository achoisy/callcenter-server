import { env } from '../env-handler';
import twilio from 'twilio';
import {
  TaskrouterAttributes,
  TwilioSetup,
  WorkersAttributes,
  Channel,
  TaskChannel,
  Service,
  WorkerAttrs,
  WorkspacePolicyOptions,
} from '../interfaces';
import { TaskRouterError, CustomError } from '../errors/';
import { WorkerInstance } from 'twilio/lib/rest/taskrouter/v1/workspace/worker';

const twilioClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN, {
  accountSid: env.TWILIO_ACCOUNT_SID,
});

const TaskRouterCapability = twilio.jwt.taskrouter.TaskRouterCapability;

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
      contact_uri: `client:${name}`,
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

  // Creating a TaskRouter Worker capability Policy
  private buildWorkspacePolicy(options: WorkspacePolicyOptions = {}) {
    const resources = options.resources || [];
    const urlComponents = [
      env.TWILIO_TASKROUTER_URL,
      env.TWILIO_TASKROUTER_VERSION,
      'Workspaces',
      env.TWILIO_WORKSPACE_SID,
    ];

    return new TaskRouterCapability.Policy({
      url: urlComponents.concat(resources).join('/'),
      method: options.method || 'GET',
      allow: true,
    });
  }

  // Create a new task in twilio taskrouter for specified callcenter
  async createTask({
    attributes,
    worflowSid,
    timeout,
    taskChannel,
  }: {
    attributes: TaskrouterAttributes;
    worflowSid: string;
    timeout: number;
    taskChannel: TaskChannel;
  }) {
    try {
      const payload = {
        workflowSid: worflowSid,
        attributes: JSON.stringify(attributes),
        timeout: timeout,
        taskChannel: taskChannel,
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

  // Create a worker capability token to give access to client side to the
  // taskrouter workes related api
  // https://www.twilio.com/docs/taskrouter/js-sdk/workspace/worker?code-sample=code-creating-a-taskrouter-worker-capability-token
  createWorkerTokens(workerSid: string) {
    const workerCapability = new TaskRouterCapability({
      accountSid: env.TWILIO_ACCOUNT_SID,
      authToken: env.TWILIO_AUTH_TOKEN,
      workspaceSid: env.TWILIO_WORKSPACE_SID,
      channelId: workerSid,
      ttl: env.TWILIO_WORKER_TOKEN_LIFETIME,
    });

    // Event Bridge Policies
    const eventBridgePolicies = twilio.jwt.taskrouter.util.defaultEventBridgePolicies(
      env.TWILIO_ACCOUNT_SID,
      workerSid
    );

    // Worker Policies
    const workerPolicies = twilio.jwt.taskrouter.util.defaultWorkerPolicies(
      env.TWILIO_TASKROUTER_VERSION,
      env.TWILIO_WORKSPACE_SID,
      workerSid
    );

    // Workspace Policies
    const workspacePolicies = [
      // Workspace fetch Policy
      this.buildWorkspacePolicy(),
      // Workspace subresources fetch Policy
      this.buildWorkspacePolicy({ resources: ['**'] }),
      // Workspace resources update Policy
      this.buildWorkspacePolicy({ resources: ['**'], method: 'POST' }),
    ];

    // Concat policies
    eventBridgePolicies
      .concat(workerPolicies)
      .concat(workspacePolicies)
      .forEach((policy) => {
        workerCapability.addPolicy(policy);
      });

    // Return capability token
    return workerCapability.toJwt();
  }
}

export const taskrouterWrapper = new Taskrouter();
