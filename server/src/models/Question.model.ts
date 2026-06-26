import { questionsDB } from '../config/db';
import { Schema } from 'mongoose';

const TestCaseSchema = new Schema(
  { input: String, expectedOutput: String },
  { _id: false }
);

const ExampleSchema = new Schema(
  { input: String, output: String, explanation: String },
  { _id: false }
);

const StarterCodeSchema = new Schema(
  { python: String, javascript: String, java: String, cpp: String },
  { _id: false }
);

const JudgeHarnessSchema = new Schema(
  { python: { type: String, default: '' } },
  { _id: false }
);

const QuestionSchema = new Schema({
  title:        { type: String, required: true },
  description:  { type: String, required: true },
  difficulty:   { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  topic:        { type: String, required: true },
  companies:    [{ type: String }],
  tags:         [{ type: String }],
  constraints:  { type: String },
  examples:     [ExampleSchema],
  testCases:    [TestCaseSchema],
  starterCode:  { type: StarterCodeSchema },
  judgeHarness: { type: JudgeHarnessSchema },
  timeLimit:    { type: Number, default: 1800 },
});

export default questionsDB.model('Question', QuestionSchema);