import { env } from '../env-handler';
import twilio, { jwt as TwilioJwt } from 'twilio';
import { TwilioClientError } from '../errors/';
import { ConferenceInstance } from 'twilio/lib/rest/api/v2010/account/conference';
import { ParticipantCodec } from 'twilio/lib/rest/insights/v1/room/participant';
import { ParticipantInstance } from 'twilio/lib/rest/api/v2010/account/conference/participant';

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

  static async getConferenceByName(
    friendlyName: string
  ): Promise<ConferenceInstance> {
    return new Promise((resolve, reject) => {
      try {
        twilioClient.conferences
          .list({
            friendlyName: friendlyName,
            status: 'in-progress',
          })
          .then((conferences) => {
            if (conferences.length === 0) {
              reject('NOT_FOUND');
            } else {
              resolve(conferences[0]);
            }
          });
      } catch (error) {
        throw new TwilioClientError('Unable to get conference');
      }
    });
  }

  static async getConferenceParticipants(
    conferenceSid: string
  ): Promise<string[]> {
    return new Promise((resolve, reject) => {
      try {
        twilioClient
          .conferences(conferenceSid)
          .participants.list()
          .then((participants) => {
            const list: ParticipantInstance['callSid'][] = participants.map(
              (participant) => participant.callSid
            );
            resolve(list);
          });
      } catch (error) {
        throw new TwilioClientError('Unable to get conference participants');
      }
    });
  }
}
