import { env } from '../env-handler';
import twilio, { jwt as TwilioJwt } from 'twilio';
import { TwilioClientError } from '../errors/';
import { ConferenceInstance } from 'twilio/lib/rest/api/v2010/account/conference';
import { ParticipantInstance } from 'twilio/lib/rest/api/v2010/account/conference/participant';
import {
  ReservationInstanceUpdateOptions,
  ReservationInstance,
} from 'twilio/lib/rest/taskrouter/v1/workspace/worker/reservation';
import { ConferenceParticipant } from '../interfaces';

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

  static getConferenceByName(
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

  static getConferenceParticipants(
    conferenceSid: string
  ): Promise<ConferenceParticipant[]> {
    return new Promise((resolve, reject) => {
      try {
        twilioClient
          .conferences(conferenceSid)
          .participants.list()
          .then((participants) => {
            const list: ConferenceParticipant[] = participants.map(
              (participant) => {
                return {
                  callSid: participant.callSid,
                  label: participant.label,
                };
              }
            );
            resolve(list);
          });
      } catch (error) {
        throw new TwilioClientError('Unable to get conference participants');
      }
    });
  }

  static setConferenceParticipantHold(
    conferenceSid: string,
    callSid: string,
    hold: boolean
  ): Promise<ParticipantInstance> {
    return new Promise((resolve, reject) => {
      try {
        twilioClient
          .conferences(conferenceSid)
          .participants(callSid)
          .update({ hold: hold })
          .then((participant) => {
            resolve(participant);
          });
      } catch (error) {
        throw new TwilioClientError(
          'Unable to set conference participant on hold'
        );
      }
    });
  }

  static addParticipantToConference(
    conferenceSid: string,
    callerId: string,
    phone: string
  ): Promise<ParticipantInstance> {
    return new Promise((resolve, reject) => {
      try {
        twilioClient
          .conferences(conferenceSid)
          .participants.create({
            to: phone,
            from: callerId,
            earlyMedia: true,
            endConferenceOnExit: true,
          })
          .then((participant) => {
            resolve(participant);
          });
      } catch (error) {
        throw new TwilioClientError('Unable to create conference call');
      }
    });
  }

  static reservationUpdate(
    workerSid: string,
    reservationSid: string,
    params: ReservationInstanceUpdateOptions
  ): Promise<ReservationInstance> {
    return new Promise((resolve, reject) => {
      try {
        twilioClient.taskrouter
          .workspaces(env.TWILIO_WORKSPACE_SID)
          .workers(workerSid)
          .reservations(reservationSid)
          .update(params)
          .then((reservation) => {
            resolve(reservation);
          });
      } catch (error) {
        throw new TwilioClientError(
          `Unable to accept reservation:${reservationSid} for worker:${workerSid}`
        );
      }
    });
  }
}
