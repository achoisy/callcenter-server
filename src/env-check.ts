require('dotenv').config();

if (!process.env.TWILIO_ACCOUNT_SID) {
  throw new Error('TWILIO_ACCOUNT_SID must be defined');
}

if (!process.env.TWILIO_AUTH_TOKEN) {
  throw new Error('TWILIO_AUTH_TOKEN must be defined');
}

if (!process.env.TWILIO_WORKSPACE_SID) {
  throw new Error('TWILIO_WORKSPACE_SID must be defined');
}

if (!process.env.TWILIO_API_KEY_SID) {
  throw new Error('TWILIO_API_KEY_SID must be defined');
}

if (!process.env.TWILIO_API_KEY_SECRET) {
  throw new Error('TWILIO_API_KEY_SECRET must be defined');
}

if (!process.env.TWILIO_CHAT_SERVICE_SID) {
  throw new Error('TWILIO_CHAT_SERVICE_SID must be defined');
}
