import { env } from '../env-handler';
import Mailgun from 'mailgun.js';
import formData from 'form-data';
import { TaskAttrs } from '../interfaces';

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: 'api',
  key: env.MAILGUN_API_KEY,
  url: 'https://api.eu.mailgun.net/',
});

export class MailgunHelper {
  static async sendMsg(subject: string, messageData: TaskAttrs) {
    try {
      const data = {
        from: `Homesecour.fr <postmaster@${
          env.MAILGUN_DOMAIN || 'homesecours.fr'
        }>`,
        to: env.CONTACT_EMAIL || 'homesecours@gmail.com',
        subject,
        template: 'homesecours-callback',
        'h:X-Mailgun-Variables': messageData.attributes.metadata,
      };

      await mg.messages.create(env.MAILGUN_DOMAIN || 'homesecours.fr', data);
      return null;
    } catch (error) {
      console.error(`MAILGUN ERROR: ${error}`);
      return error;
    }
  }
}
