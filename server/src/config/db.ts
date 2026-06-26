import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()
export const usersDB = mongoose.createConnection(process.env.MONGODB_USERS_URI!)
export const questionsDB = mongoose.createConnection(process.env.MONGODB_QUESTIONS_URI!)

export const connectDB = async () => {
  await usersDB.asPromise()
  console.log('✅ Users DB connected')
  await questionsDB.asPromise()
  console.log('✅ Questions DB connected')
}