"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const submissionController_1 = require("../controllers/submissionController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Run code (allows testing sample cases or custom input)
router.post('/run', auth_1.optionalAuth, submissionController_1.runCode);
// Submit code (authenticated students submit against hidden test cases)
router.post('/submit', auth_1.authenticateToken, submissionController_1.submitCode);
// Current user submissions
router.get('/my', auth_1.authenticateToken, submissionController_1.getUserSubmissions);
// Current user submissions for a specific problem
router.get('/problem/:problemId', auth_1.authenticateToken, submissionController_1.getProblemSubmissions);
// Admin: view all submissions across platform
router.get('/admin/all', auth_1.authenticateToken, auth_1.requireAdmin, submissionController_1.getAllSubmissions);
exports.default = router;
