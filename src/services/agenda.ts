import { Agenda, Job } from 'agenda';
import { taskrouterWrapper } from './taskrouter-helper';
import {
  TaskrouterAttributes,
  TaskChannel,
  JobNames,
  TaskAttrs,
} from '../interfaces';

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
      const { attributes, workflowSid, taskChannel } = task.attrs.data;
      await taskrouterWrapper.createTask({
        attributes,
        workflowSid,
        taskChannel,
      });
    });
  }

  schedule(when: Date | string, jobName: JobNames, data: any) {
    this.agenda.schedule(when, jobName, data);
  }

  scheduleTask(when: Date | string, jobId: string, data: TaskAttrs) {
    this.agenda.define(jobId, async () => {
      await taskrouterWrapper.createTask(data);
    });
    this.agenda.schedule(when, jobId, data);
  }

  now(jobName: JobNames, data: any) {
    this.agenda.now(jobName, data);
  }

  nowTask(jobId: string, data: TaskAttrs) {
    this.agenda.define(jobId, async () => {
      await taskrouterWrapper.createTask(data);
    });
    this.agenda.now(jobId, data);
  }

  cancel(jobId: string): Promise<number | undefined> {
    return this.agenda.cancel({ name: jobId });
  }

  disconnect() {
    if (this.agenda) {
      return this.agenda.stop();
    }
    return;
  }
}

export const agendaWrapper = new AgendaWrapper();
