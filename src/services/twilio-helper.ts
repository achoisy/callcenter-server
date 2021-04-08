import { env } from '../env-handler';
import twilio, { jwt as TwilioJwt } from 'twilio';
import { TwilioClientError } from '../errors/';

const AccessToken = TwilioJwt.AccessToken;
const twilioClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN, {
  accountSid: env.TWILIO_ACCOUNT_SID,
});

export class Twilio {
  // Create a twilio access token to give acces to user
  // https://www.twilio.com/docs/iam/access-tokens
  static createAccessToken(
    applicationSid: string,
    friendlyName: string,
    endpointId: string
  ) {
    const accessToken = new AccessToken(
      env.TWILIO_ACCOUNT_SID,
      env.TWILIO_API_KEY_SID,
      env.TWILIO_API_KEY_SECRET,
      { ttl: env.TWILIO_USER_TOKEN_LIFETIME }
    );

    accessToken.identity = friendlyName;

    /* grant the token Twilio Programmable Chat capabilities */
    const chatGrant = new AccessToken.ChatGrant({
      serviceSid: env.TWILIO_CHAT_SERVICE_SID,
      endpointId: endpointId,
    });

    /* grant the access token Twilio Video capabilities */
    const videoGrant = new AccessToken.VideoGrant();

    /* grant the token Twilio Client capabilities */
    const clientGrant = new AccessToken.VoiceGrant({
      incomingAllow: true,
      outgoingApplicationSid: applicationSid,
    });

    accessToken.addGrant(chatGrant);
    accessToken.addGrant(videoGrant);
    accessToken.addGrant(clientGrant);

    // return access token
    return accessToken.toJwt();
  }

  static async getConferenceByName(friendlyName: string) {
    try {
      return twilioClient.conferences.list({
        friendlyName: friendlyName,
        status: 'in-progress',
      });
    } catch (error) {
      throw new TwilioClientError('Unable to get conference');
    }
  }
}
