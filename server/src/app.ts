import express from 'express';
import cors from 'cors';
import { ENV } from './lib/ENV';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import leaderboardRoutes from './routes/leaderboard.routes';
import { errorHandler } from './middleware/error.middleware';

const app = express();

app.use(cors({ origin: ENV.CLIENT_URL }));
app.use(express.json());

// Health check
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', project: 'CodeClash' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// Error handler (must be last)
app.use(errorHandler);

export default app;