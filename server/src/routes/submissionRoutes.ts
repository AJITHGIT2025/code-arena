import { Router } from 'express';
import {
  runCode,
  submitCode,
  getUserSubmissions,
  getProblemSubmissions,
  getAllSubmissions,
} from '../controllers/submissionController';
import { authenticateToken, requireAdmin, optionalAuth } from '../middleware/auth';

const router = Router();

// Run code (allows testing sample cases or custom input)
router.post('/run', optionalAuth, runCode);

// Submit code (authenticated students submit against hidden test cases)
router.post('/submit', authenticateToken, submitCode);

// Current user submissions
router.get('/my', authenticateToken, getUserSubmissions);

// Current user submissions for a specific problem
router.get('/problem/:problemId', authenticateToken, getProblemSubmissions);

// Admin: view all submissions across platform
router.get('/admin/all', authenticateToken, requireAdmin, getAllSubmissions);

export default router;
