import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/authRoutes';
import problemRoutes from './routes/problemRoutes';
import submissionRoutes from './routes/submissionRoutes';
import statsRoutes from './routes/statsRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Middlewares
app.use(
  cors({
    origin: process.env.CLIENT_URL ? [process.env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'] : '*',
    credentials: true,
  })
);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Rate limiter for execution and submission endpoints
const executionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // max 30 runs/submits per minute per IP
  message: { error: 'Too many execution requests. Please wait a moment before trying again.' },
});

// Route mounts
app.use('/api/auth', authRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/submissions', executionLimiter, submissionRoutes);
app.use('/api/stats', statsRoutes);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    platform: 'CODE ARENA',
    timestamp: new Date().toISOString(),
  });
});

// Serve frontend build in production if available
const clientDistPath = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

app.get('*', (req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      // In development when client dist doesn't exist yet, return API message
      res.status(200).send('CODE ARENA API Server running. Open the frontend at http://localhost:5173');
    }
  });
});

// Centralized error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`  CODE ARENA Server running on port ${PORT}`);
  console.log(`  Health Check: http://localhost:${PORT}/api/health`);
  console.log(`===============================================`);
});

export default app;
