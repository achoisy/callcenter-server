import twilio from 'twilio';
import { TaskrouterAttriutes, TwilioSetup } from '../interfaces';

export class Taskrouter {
  private client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  constructor(private configuration: TwilioSetup) {}

  // Create a new task in twilio taskrouter for specified callcenter
  async createTask(attributes: TaskrouterAttriutes) {
    const payload = {
      workflowSid: this.configuration.workflowSid,
      attributes: JSON.stringify(attributes),
      timeout: 3600,
      taskChannel: 'voice',
    };

    return this.client.taskrouter
      .workspaces(process.env.TWILIO_WORKSPACE_SID!)
      .tasks.create(payload);
  }
}
