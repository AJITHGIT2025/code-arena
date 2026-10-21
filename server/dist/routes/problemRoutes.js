"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const problemController_1 = require("../controllers/problemController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public / Student routes
router.get('/', auth_1.optionalAuth, problemController_1.getProblems);
router.get('/:codeOrId', auth_1.optionalAuth, problemController_1.getProblemByCodeOrId);
// Admin-only problem management routes
router.get('/admin/export', auth_1.authenticateToken, auth_1.requireAdmin, problemController_1.exportProblems);
router.post('/admin/import', auth_1.authenticateToken, auth_1.requireAdmin, problemController_1.importProblems);
router.get('/admin/detail/:id', auth_1.authenticateToken, auth_1.requireAdmin, problemController_1.getAdminProblemById);
router.post('/', auth_1.authenticateToken, auth_1.requireAdmin, problemController_1.createProblem);
router.put('/:id', auth_1.authenticateToken, auth_1.requireAdmin, problemController_1.updateProblem);
router.delete('/:id', auth_1.authenticateToken, auth_1.requireAdmin, problemController_1.deleteProblem);
router.patch('/:id/publish', auth_1.authenticateToken, auth_1.requireAdmin, problemController_1.togglePublish);
exports.default = router;
