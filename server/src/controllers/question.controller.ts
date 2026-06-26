import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Question from '../models/Question.model';

// GET /api/questions?topic=Arrays&difficulty=Medium&company=Google
export const getQuestions = async (req: AuthRequest, res: Response) => {
  try {
    const { topic, difficulty, company } = req.query;

    const filter: any = {};
    if (topic) filter.topic = topic;
    if (difficulty) filter.difficulty = difficulty;
    if (company && company !== 'Any') filter.companies = company;

    const questions = await Question.find(filter)
      .select('-testCases -judgeHarness') // don't expose test cases to frontend
      .lean();

    res.json({ questions });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/questions/:id
export const getQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const question = await Question.findById(req.params.id)
      .select('-judgeHarness')
      .lean();
      
    if (!question) return res.status(404).json({ message: 'Question not found' });

    res.json({ question });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};