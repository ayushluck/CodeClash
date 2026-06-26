import { Schema } from 'mongoose';
import { questionsDB } from '../config/db';

const TestCaseSchema = new Schema({
  input:          { type: String, required: true },
  expectedOutput: { type: String, required: true },
}, { _id: false });

const StarterCodeSchema = new Schema({
  javascript: { type: String, default: '' },
  python:     { type: String, default: '' },
  java:       { type: String, default: '' },
  cpp:        { type: String, default: '' },
}, { _id: false });

const QuestionSchema = new Schema({
  title:       { type: String, required: true },
  description: { type: String, required: true },
  difficulty:  { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  topic:       { type: String, required: true },
  companies:   [{ type: String }],
  testCases:   [TestCaseSchema],
  starterCode: { type: StarterCodeSchema, default: () => ({}) },
  constraints: { type: String, default: '' },
  examples:    [{ input: String, output: String, explanation: String }],
  timeLimit:   { type: Number, default: 1800 },
}, { timestamps: true });

export default questionsDB.model('Question', QuestionSchema);