// server/src/config/env.ts
import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || '5000',
  MONGODB_USERS_URI: process.env.MONGODB_USERS_URI!,
  MONGODB_QUESTIONS_URI: process.env.MONGODB_QUESTIONS_URI!,
  JWT_SECRET: process.env.JWT_SECRET!,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY!,
  IMAGEKIT_PUBLIC_KEY: process.env.IMAGEKIT_PUBLIC_KEY!,
  IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY!,
  IMAGEKIT_URL_ENDPOINT: process.env.IMAGEKIT_URL_ENDPOINT!,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
};