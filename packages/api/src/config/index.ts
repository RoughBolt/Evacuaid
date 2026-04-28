import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'evacuaid_jwt_secret_dev',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'evacuaid_refresh_secret_dev',
  jwtExpiresIn: '15m',
  jwtRefreshExpiresIn: '7d',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://evacuaid:evacuaid_secret@localhost:5432/evacuaid_db',
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    fromNumber: process.env.TWILIO_FROM_NUMBER || '',
  },
  hotelEmergencyContacts: {
    police: process.env.EMERGENCY_POLICE || '100',
    fire: process.env.EMERGENCY_FIRE || '101',
    ambulance: process.env.EMERGENCY_AMBULANCE || '102',
    hotelSecurity: process.env.HOTEL_SECURITY || '+911234567890',
  },
  hotelName: process.env.HOTEL_NAME || 'Grand Evacuaid Hotel',
  hotelId: process.env.HOTEL_ID || 'hotel_grand_001',
};
