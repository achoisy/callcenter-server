import { EnvType, load } from 'ts-dotenv';
// TODO: convert to class
export type Env = EnvType<typeof schema>;

export const schema = {
  // Ports
  HTTP_PORT: Number,
  HTTPS_PORT: Number,

  // TWILIO Secrets
  TWILIO_ACCOUNT_SID: String,
  TWILIO_AUTH_TOKEN: String,
  TWILIO_WORKSPACE_SID: String,
  TWILIO_API_KEY_SID: String,
  TWILIO_API_KEY_SECRET: String,
  TWILIO_CHAT_SERVICE_SID: String,

  //JWT secret key
  JWT_KEY: String,
};

export let env: Env;

export function loadEnv(): void {
  env = load(schema);
}
