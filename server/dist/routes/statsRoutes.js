"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const statsController_1 = require("../controllers/statsController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Leaderboard (public / student)
router.get('/leaderboard', auth_1.optionalAuth, statsController_1.getLeaderboard);
// Student dashboard personal analytics
router.get('/dashboard', auth_1.authenticateToken, statsController_1.getStudentDashboardStats);
// Admin platform analytics
router.get('/admin', auth_1.authenticateToken, auth_1.requireAdmin, statsController_1.getAdminStats);
exports.default = router;
