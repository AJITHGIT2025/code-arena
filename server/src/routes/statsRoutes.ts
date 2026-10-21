import { Router } from 'express';
import { getLeaderboard, getStudentDashboardStats, getAdminStats } from '../controllers/statsController';
import { authenticateToken, requireAdmin, optionalAuth } from '../middleware/auth';

const router = Router();

// Leaderboard (public / student)
router.get('/leaderboard', optionalAuth, getLeaderboard);

// Student dashboard personal analytics
router.get('/dashboard', authenticateToken, getStudentDashboardStats);

// Admin platform analytics
router.get('/admin', authenticateToken, requireAdmin, getAdminStats);

export default router;
