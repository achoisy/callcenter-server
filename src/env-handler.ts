import { EnvType, load } from 'ts-dotenv';
// TODO: convert to class
export type Env = EnvType<typeof schema>;

export const schema = {
  // Node env setup
  NODE_ENV: ['production' as const, 'development' as const],

  // Production setup
  PROD_BASE_URL: String,
  SSL_PRIVKEY_PEM: String,
  SSL_FULLCHAIN_PEM: String,

  // Developpement setup
  DEV_BASE_URL: String,

  // API token route
  API_TOKEN_URI: String,

  // Mongodb
  MONGODB_URL: String,

  // Ports
  HTTP_PORT: Number,
  HTTPS_PORT: Number,

  // CORS origin
  CORS_ORIGIN: String,

  // TWILIO Secrets
  TWILIO_ACCOUNT_SID: String,
  TWILIO_AUTH_TOKEN: String,
  TWILIO_WORKSPACE_SID: String,
  TWILIO_API_KEY_SID: String,
  TWILIO_API_KEY_SECRET: String,
  TWILIO_CHAT_SERVICE_SID: String,
  TWILIO_USER_TOKEN_LIFETIME: Number,
  TWILIO_WORKER_TOKEN_LIFETIME: Number,
  TWILIO_TASKROUTER_URL: String,
  TWILIO_TASKROUTER_VERSION: String,

  //JWT secret key
  JWT_KEY: String,
};

export let env: Env;

export function loadEnv(): void {
  env = load(schema);
}
