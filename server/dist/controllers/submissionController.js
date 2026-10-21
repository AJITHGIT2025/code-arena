"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllSubmissions = exports.getProblemSubmissions = exports.getUserSubmissions = exports.submitCode = exports.runCode = void 0;
const prisma_1 = __importDefault(require("../db/prisma"));
const judgeService_1 = require("../services/judgeService");
/**
 * Run Code: Test against sample cases or custom input
 */
const runCode = async (req, res) => {
    try {
        const { problemId, language, sourceCode, customInput } = req.body;
        if (!language || !sourceCode) {
            res.status(400).json({ error: 'Language and source code are required.' });
            return;
        }
        const validLanguages = ['c', 'cpp', 'java', 'python'];
        if (!validLanguages.includes(language)) {
            res.status(400).json({ error: `Unsupported language: ${language}. Choose from c, cpp, java, python.` });
            return;
        }
        // 1. If custom input is provided, run single execution
        if (typeof customInput === 'string' && customInput.trim() !== '') {
            const result = await judgeService_1.judgeService.execute(language, sourceCode, customInput);
            let status = 'Success';
            let error = null;
            if (result.status.id === 6 || result.compile_output) {
                status = 'Compilation Error';
                error = result.compile_output || result.stderr;
            }
            else if (result.status.id === 5) {
                status = 'Time Limit Exceeded';
                error = 'Execution exceeded time limit.';
            }
            else if (result.status.id !== 3 && result.stderr) {
                status = 'Runtime Error';
                error = result.stderr;
            }
            res.json({
                isCustomInput: true,
                status,
                input: customInput,
                actualOutput: result.stdout || '',
                errorMessage: error,
                executionTime: typeof result.time === 'number' ? result.time : parseFloat(result.time) || 0,
            });
            return;
        }
        // 2. Run against problem's sample test cases
        if (!problemId) {
            res.status(400).json({ error: 'problemId is required when no custom input is provided.' });
            return;
        }
        const problem = await prisma_1.default.problem.findUnique({
            where: { id: problemId },
            include: {
                sampleTestCases: {
                    orderBy: { displayOrder: 'asc' },
                },
            },
        });
        if (!problem) {
            res.status(404).json({ error: 'Problem not found.' });
            return;
        }
        const testCases = problem.sampleTestCases;
        if (testCases.length === 0) {
            // If problem has no sample test cases, run with empty stdin
            const result = await judgeService_1.judgeService.execute(language, sourceCode, '');
            res.json({
                isCustomInput: false,
                allPassed: true,
                results: [
                    {
                        testCaseIndex: 1,
                        input: '',
                        expectedOutput: '',
                        actualOutput: result.stdout || '',
                        status: result.status.description,
                        passed: true,
                        executionTime: parseFloat(result.time) || 0,
                        errorMessage: result.compile_output || result.stderr || null,
                    },
                ],
            });
            return;
        }
        const results = [];
        let allPassed = true;
        let compilationError = false;
        for (let i = 0; i < testCases.length; i++) {
            const tc = testCases[i];
            const result = await judgeService_1.judgeService.execute(language, sourceCode, tc.inputData, problem.timeLimit, problem.memoryLimit);
            // Check for compilation error
            if (result.status.id === 6 || result.compile_output) {
                compilationError = true;
                results.push({
                    testCaseIndex: i + 1,
                    input: tc.inputData,
                    expectedOutput: tc.expectedOutput,
                    actualOutput: '',
                    status: 'Compilation Error',
                    passed: false,
                    executionTime: 0,
                    errorMessage: result.compile_output || result.stderr,
                });
                // Stop evaluating rest on compilation error
                allPassed = false;
                break;
            }
            if (result.status.id === 5) {
                results.push({
                    testCaseIndex: i + 1,
                    input: tc.inputData,
                    expectedOutput: tc.expectedOutput,
                    actualOutput: '',
                    status: 'Time Limit Exceeded',
                    passed: false,
                    executionTime: problem.timeLimit,
                    errorMessage: 'Time Limit Exceeded',
                });
                allPassed = false;
                continue;
            }
            if (result.status.id !== 3 && result.stderr) {
                results.push({
                    testCaseIndex: i + 1,
                    input: tc.inputData,
                    expectedOutput: tc.expectedOutput,
                    actualOutput: result.stdout || '',
                    status: 'Runtime Error',
                    passed: false,
                    executionTime: parseFloat(result.time) || 0,
                    errorMessage: result.stderr,
                });
                allPassed = false;
                continue;
            }
            const normalizedActual = judgeService_1.judgeService.normalizeOutput(result.stdout);
            const normalizedExpected = judgeService_1.judgeService.normalizeOutput(tc.expectedOutput);
            const passed = normalizedActual === normalizedExpected;
            if (!passed) {
                allPassed = false;
            }
            results.push({
                testCaseIndex: i + 1,
                input: tc.inputData,
                expectedOutput: tc.expectedOutput,
                actualOutput: result.stdout || '',
                status: passed ? 'Passed' : 'Wrong Answer',
                passed,
                executionTime: parseFloat(result.time) || 0,
                errorMessage: null,
            });
        }
        res.json({
            isCustomInput: false,
            allPassed,
            compilationError,
            results,
        });
    }
    catch (error) {
        console.error('runCode error:', error);
        res.status(500).json({ error: error.message || 'Execution error.' });
    }
};
exports.runCode = runCode;
/**
 * Submit Code: Evaluates against hidden test cases, records score & progress
 */
const submitCode = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'You must be logged in to submit solutions.' });
            return;
        }
        const { problemId, language, sourceCode } = req.body;
        if (!problemId || !language || !sourceCode) {
            res.status(400).json({ error: 'Problem ID, language, and source code are required.' });
            return;
        }
        const validLanguages = ['c', 'cpp', 'java', 'python'];
        if (!validLanguages.includes(language)) {
            res.status(400).json({ error: `Unsupported language: ${language}. Choose from c, cpp, java, python.` });
            return;
        }
        // Retrieve problem and hidden test cases
        const problem = await prisma_1.default.problem.findUnique({
            where: { id: problemId },
            include: {
                hiddenTestCases: true,
                sampleTestCases: true,
            },
        });
        if (!problem) {
            res.status(404).json({ error: 'Problem not found.' });
            return;
        }
        // Hidden test cases evaluation set. If problem has no hidden cases, fall back to sample test cases
        const testCasesToEvaluate = problem.hiddenTestCases.length > 0
            ? problem.hiddenTestCases
            : problem.sampleTestCases.map((s) => ({
                id: s.id,
                problemId: s.problemId,
                inputData: s.inputData,
                expectedOutput: s.expectedOutput,
                pointsOrWeight: 1,
            }));
        const totalTestCases = testCasesToEvaluate.length;
        let passedTestCases = 0;
        let overallStatus = 'Accepted';
        let errorMessage = null;
        let maxExecutionTime = 0;
        // Evaluation item summary for student (WITHOUT exposing hidden test inputs/outputs!)
        const caseSummaries = [];
        for (let i = 0; i < totalTestCases; i++) {
            const tc = testCasesToEvaluate[i];
            const result = await judgeService_1.judgeService.execute(language, sourceCode, tc.inputData, problem.timeLimit, problem.memoryLimit);
            const caseTime = parseFloat(result.time) || 0;
            if (caseTime > maxExecutionTime) {
                maxExecutionTime = caseTime;
            }
            // 1. Compilation Error
            if (result.status.id === 6 || result.compile_output) {
                overallStatus = 'Compilation Error';
                errorMessage = result.compile_output || result.stderr || 'Compilation error occurred.';
                caseSummaries.push({
                    testCaseIndex: i + 1,
                    passed: false,
                    status: 'Compilation Error',
                    executionTime: 0,
                });
                break; // Stop evaluating remaining cases
            }
            // 2. Time Limit Exceeded
            if (result.status.id === 5) {
                if (overallStatus === 'Accepted')
                    overallStatus = 'Time Limit Exceeded';
                caseSummaries.push({
                    testCaseIndex: i + 1,
                    passed: false,
                    status: 'Time Limit Exceeded',
                    executionTime: problem.timeLimit,
                });
                continue;
            }
            // 3. Runtime Error
            if (result.status.id !== 3 && result.stderr) {
                if (overallStatus === 'Accepted')
                    overallStatus = 'Runtime Error';
                if (!errorMessage)
                    errorMessage = result.stderr;
                caseSummaries.push({
                    testCaseIndex: i + 1,
                    passed: false,
                    status: 'Runtime Error',
                    executionTime: caseTime,
                });
                continue;
            }
            // 4. Output verification
            const normalizedActual = judgeService_1.judgeService.normalizeOutput(result.stdout);
            const normalizedExpected = judgeService_1.judgeService.normalizeOutput(tc.expectedOutput);
            const passed = normalizedActual === normalizedExpected;
            if (passed) {
                passedTestCases++;
                caseSummaries.push({
                    testCaseIndex: i + 1,
                    passed: true,
                    status: 'Passed',
                    executionTime: caseTime,
                });
            }
            else {
                if (overallStatus === 'Accepted')
                    overallStatus = 'Wrong Answer';
                caseSummaries.push({
                    testCaseIndex: i + 1,
                    passed: false,
                    status: 'Wrong Answer',
                    executionTime: caseTime,
                });
            }
        }
        // Calculate score
        let pointsEarned = 0;
        if (totalTestCases > 0) {
            if (overallStatus === 'Accepted' && passedTestCases === totalTestCases) {
                pointsEarned = problem.points;
            }
            else {
                // Partial scoring based on fraction of test cases passed
                pointsEarned = Math.floor((passedTestCases / totalTestCases) * problem.points);
            }
        }
        // Record submission in database
        const submission = await prisma_1.default.submission.create({
            data: {
                userId: req.user.id,
                problemId: problem.id,
                language,
                sourceCode,
                status: overallStatus,
                passedTestCases,
                totalTestCases,
                pointsEarned,
                executionTime: maxExecutionTime,
                errorMessage,
            },
        });
        // Update ProblemProgress
        const isFullySolved = overallStatus === 'Accepted' && passedTestCases === totalTestCases;
        const existingProgress = await prisma_1.default.problemProgress.findUnique({
            where: {
                userId_problemId: {
                    userId: req.user.id,
                    problemId: problem.id,
                },
            },
        });
        if (existingProgress) {
            await prisma_1.default.problemProgress.update({
                where: { id: existingProgress.id },
                data: {
                    solved: existingProgress.solved || isFullySolved,
                    bestScore: Math.max(existingProgress.bestScore, pointsEarned),
                    attempts: existingProgress.attempts + 1,
                },
            });
        }
        else {
            await prisma_1.default.problemProgress.create({
                data: {
                    userId: req.user.id,
                    problemId: problem.id,
                    solved: isFullySolved,
                    bestScore: pointsEarned,
                    attempts: 1,
                },
            });
        }
        res.json({
            submissionId: submission.id,
            status: overallStatus,
            passedTestCases,
            totalTestCases,
            pointsEarned,
            totalPoints: problem.points,
            executionTime: maxExecutionTime,
            errorMessage,
            cases: caseSummaries,
            solved: isFullySolved,
        });
    }
    catch (error) {
        console.error('submitCode error:', error);
        res.status(500).json({ error: error.message || 'Submission evaluation error.' });
    }
};
exports.submitCode = submitCode;
/**
 * Get Submissions of current student
 */
const getUserSubmissions = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated.' });
            return;
        }
        const { page = '1', limit = '20' } = req.query;
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 20;
        const [total, submissions] = await Promise.all([
            prisma_1.default.submission.count({ where: { userId: req.user.id } }),
            prisma_1.default.submission.findMany({
                where: { userId: req.user.id },
                include: {
                    problem: {
                        select: {
                            id: true,
                            problemCode: true,
                            title: true,
                            academicYear: true,
                            difficulty: true,
                            points: true,
                        },
                    },
                },
                orderBy: { submittedAt: 'desc' },
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
            }),
        ]);
        res.json({
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
            submissions,
        });
    }
    catch (error) {
        console.error('getUserSubmissions error:', error);
        res.status(500).json({ error: 'Failed to retrieve submissions.' });
    }
};
exports.getUserSubmissions = getUserSubmissions;
/**
 * Get Submissions for a specific problem by current student
 */
const getProblemSubmissions = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated.' });
            return;
        }
        const { problemId } = req.params;
        const submissions = await prisma_1.default.submission.findMany({
            where: {
                userId: req.user.id,
                problemId,
            },
            orderBy: { submittedAt: 'desc' },
            take: 20,
        });
        res.json({ submissions });
    }
    catch (error) {
        console.error('getProblemSubmissions error:', error);
        res.status(500).json({ error: 'Failed to retrieve submissions for problem.' });
    }
};
exports.getProblemSubmissions = getProblemSubmissions;
/**
 * Admin: View all submissions across platform
 */
const getAllSubmissions = async (req, res) => {
    try {
        const { status, language, academicYear, page = '1', limit = '30' } = req.query;
        const where = {};
        if (status && status !== 'All')
            where.status = status;
        if (language && language !== 'All')
            where.language = language;
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 30;
        const [total, submissions] = await Promise.all([
            prisma_1.default.submission.count({ where }),
            prisma_1.default.submission.findMany({
                where,
                include: {
                    user: {
                        select: { id: true, name: true, email: true, academicYear: true },
                    },
                    problem: {
                        select: { id: true, problemCode: true, title: true, difficulty: true },
                    },
                },
                orderBy: { submittedAt: 'desc' },
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
            }),
        ]);
        res.json({
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
            submissions,
        });
    }
    catch (error) {
        console.error('getAllSubmissions error:', error);
        res.status(500).json({ error: 'Failed to retrieve admin submissions.' });
    }
};
exports.getAllSubmissions = getAllSubmissions;
