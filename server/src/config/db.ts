import mongoose from 'mongoose';
import { ENV } from '../lib/ENV';
export const usersDB = mongoose.createConnection(ENV.MONGODB_USERS_URI);
export const questionsDB = mongoose.createConnection(ENV.MONGODB_QUESTIONS_URI);

export const connectDB = async () => {
  usersDB.on('connected', () => console.log('✅ Users DB connected'));
  usersDB.on('error', (err) => console.error('❌ Users DB error:', err));
  questionsDB.on('connected', () => console.log('✅ Questions DB connected'));
  questionsDB.on('error', (err) => console.error('❌ Questions DB error:', err));
};