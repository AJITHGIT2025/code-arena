import { Router } from 'express';
import {
  getProblems,
  getProblemByCodeOrId,
  getAdminProblemById,
  createProblem,
  updateProblem,
  deleteProblem,
  togglePublish,
  exportProblems,
  importProblems,
} from '../controllers/problemController';
import { authenticateToken, requireAdmin, optionalAuth } from '../middleware/auth';

const router = Router();

// Public / Student routes
router.get('/', optionalAuth, getProblems);
router.get('/:codeOrId', optionalAuth, getProblemByCodeOrId);

// Admin-only problem management routes
router.get('/admin/export', authenticateToken, requireAdmin, exportProblems);
router.post('/admin/import', authenticateToken, requireAdmin, importProblems);
router.get('/admin/detail/:id', authenticateToken, requireAdmin, getAdminProblemById);
router.post('/', authenticateToken, requireAdmin, createProblem);
router.put('/:id', authenticateToken, requireAdmin, updateProblem);
router.delete('/:id', authenticateToken, requireAdmin, deleteProblem);
router.patch('/:id/publish', authenticateToken, requireAdmin, togglePublish);

export default router;
