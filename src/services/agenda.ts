import { Agenda, Job } from 'agenda';
// import { taskrouterWrapper } from './taskrouter-helper';
import { MailgunHelper as mailgun } from './mailgun';
import { TaskAttrs } from '../interfaces';

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

      //Start agenda
      return this._agenda.start();
    } catch (error) {
      throw new Error('Agenda connection error');
    }
  }

  scheduleTask(when: Date | string, jobId: string, data: TaskAttrs) {
    this.agenda.define(jobId, async () => {
      // Switching from phone callback to email
      // uncomment next line to put back phone callack !
      // --------------
      // await taskrouterWrapper.createTask(data);
      // --------------
      await mailgun.sendMsg(
        `[${data.attributes.title}] ${data.attributes.name}`,
        data
      );
    });
    this.agenda.schedule(when, jobId, data);
  }

  nowTask(jobId: string, data: TaskAttrs) {
    this.agenda.define(jobId, async () => {
      // Switching from phone callback to email
      // uncomment next line to put back phone callack !
      // --------------
      // await taskrouterWrapper.createTask(data);
      // --------------
      await mailgun.sendMsg(
        `[${data.attributes.title}] ${data.attributes.name}`,
        data
      );
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
