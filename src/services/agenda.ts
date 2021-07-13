import { Agenda, Job } from 'agenda';
import { taskrouterWrapper } from './taskrouter-helper';
import { TaskrouterAttributes, TaskChannel, JobNames } from '../interfaces';

interface Overrides {
  attributes: TaskrouterAttributes;
  worflowSid: string;
  timeout: number;
  taskChannel: TaskChannel;
}

class AgendaWrapper {
  private _agenda?: Agenda;

  get agenda() {
    if (!this._agenda) {
      throw new Error('Cannot access Agenda before connection');
    }
    return this._agenda;
  }

  connect(mongoConnectionString: string) {
    try {
      this._agenda = new Agenda({ db: { address: mongoConnectionString } });

      // Define jobs
      this.defineJobs();

      //Start agenda
      return this._agenda.start();
    } catch (error) {
      throw new Error('Agenda connection error');
    }
  }

  private defineJobs() {
    // Rappel Client WEB
    this.agenda.define(JobNames.rappelClientWeb, async (task: any) => {
      const { attributes, worflowSid, timeout, taskChannel } = task.attrs.data;
      await taskrouterWrapper.createTask({
        attributes,
        worflowSid,
        timeout,
        taskChannel,
      });
    });
  }

  schedule(when: Date | string, jobName: JobNames, data: any) {
    this.agenda.schedule(when, jobName, data);
  }

  now(jobName: JobNames, data: any) {
    this.agenda.now(jobName, data);
  }

  disconnect() {
    if (this.agenda) {
      return this.agenda.stop();
    }
    return;
  }
}

export const agendaWrapper = new AgendaWrapper();
