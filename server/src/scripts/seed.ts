import mongoose from 'mongoose';
import { ENV } from '../lib/ENV';
import { questionsDB } from '../config/db';
import { Schema } from 'mongoose';
import fs from 'fs';
import path from 'path';

// inline mini-model just for seeding (avoids import issues)
const QuestionSchema = new Schema({}, { strict: false });
const Question = questionsDB.model('Question', QuestionSchema);

const seed = async () => {
  console.log('Connecting to questions DB...');

  await new Promise<void>((resolve) => {
    questionsDB.once('connected', resolve);
  });

  console.log('Connected ✅');

  // Load both JSON files
  const batch1 = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'questions1.json'), 'utf8')
  );
  const batch2 = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'questions2.json'), 'utf8')
  );

  const allQuestions = [...batch1, ...batch2];
  console.log(`Loaded ${allQuestions.length} questions`);

  // Clear existing questions first
  await Question.deleteMany({});
  console.log('Cleared existing questions');

  // Insert all
  await Question.insertMany(allQuestions);
  console.log(`Inserted ${allQuestions.length} questions ✅`);

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});