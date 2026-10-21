"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importProblems = exports.exportProblems = exports.togglePublish = exports.deleteProblem = exports.updateProblem = exports.createProblem = exports.getAdminProblemById = exports.getProblemByCodeOrId = exports.getProblems = void 0;
const prisma_1 = __importDefault(require("../db/prisma"));
/**
 * Public problem listing (with optional student progress tracking)
 */
const getProblems = async (req, res) => {
    try {
        const { year, topic, difficulty, search, page = '1', limit = '50' } = req.query;
        const whereClause = {};
        // Only show published problems to non-admin users
        const isAdmin = req.user?.role === 'ADMIN';
        if (!isAdmin) {
            whereClause.isPublished = true;
        }
        if (year && typeof year === 'string' && year !== 'All') {
            whereClause.academicYear = year;
        }
        if (topic && typeof topic === 'string' && topic !== 'All') {
            whereClause.topic = topic;
        }
        if (difficulty && typeof difficulty === 'string' && difficulty !== 'All') {
            whereClause.difficulty = difficulty;
        }
        if (search && typeof search === 'string' && search.trim() !== '') {
            whereClause.OR = [
                { title: { contains: search.trim() } },
                { problemCode: { contains: search.trim() } },
                { topic: { contains: search.trim() } },
            ];
        }
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 50;
        const skip = (pageNum - 1) * limitNum;
        const [total, problems] = await Promise.all([
            prisma_1.default.problem.count({ where: whereClause }),
            prisma_1.default.problem.findMany({
                where: whereClause,
                select: {
                    id: true,
                    problemCode: true,
                    title: true,
                    academicYear: true,
                    topic: true,
                    difficulty: true,
                    points: true,
                    isPublished: true,
                    createdAt: true,
                    _count: {
                        select: {
                            submissions: true,
                            sampleTestCases: true,
                            hiddenTestCases: true,
                        },
                    },
                },
                orderBy: [{ academicYear: 'asc' }, { points: 'asc' }],
                skip,
                take: limitNum,
            }),
        ]);
        // If student is logged in, attach their solved status
        let progressMap = {};
        if (req.user?.id) {
            const userProgress = await prisma_1.default.problemProgress.findMany({
                where: { userId: req.user.id },
            });
            userProgress.forEach((p) => {
                progressMap[p.problemId] = { solved: p.solved, bestScore: p.bestScore };
            });
        }
        const problemsWithStatus = problems.map((p) => ({
            ...p,
            solved: progressMap[p.id]?.solved || false,
            bestScore: progressMap[p.id]?.bestScore || 0,
            totalSubmissions: p._count.submissions,
            sampleCaseCount: p._count.sampleTestCases,
            hiddenCaseCount: isAdmin ? p._count.hiddenTestCases : undefined,
        }));
        res.json({
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
            problems: problemsWithStatus,
        });
    }
    catch (error) {
        console.error('getProblems error:', error);
        res.status(500).json({ error: 'Failed to retrieve problems.' });
    }
};
exports.getProblems = getProblems;
/**
 * Public problem details (NEVER exposes hidden test cases!)
 */
const getProblemByCodeOrId = async (req, res) => {
    try {
        const { codeOrId } = req.params;
        const problem = await prisma_1.default.problem.findFirst({
            where: {
                OR: [{ id: codeOrId }, { problemCode: codeOrId }],
            },
            include: {
                sampleTestCases: {
                    orderBy: { displayOrder: 'asc' },
                    select: {
                        id: true,
                        inputData: true,
                        expectedOutput: true,
                        explanation: true,
                        displayOrder: true,
                    },
                },
            },
        });
        if (!problem) {
            res.status(404).json({ error: 'Problem not found.' });
            return;
        }
        if (!problem.isPublished && req.user?.role !== 'ADMIN') {
            res.status(403).json({ error: 'This problem is currently unpublished.' });
            return;
        }
        // Check user progress if logged in
        let userProgress = null;
        if (req.user?.id) {
            userProgress = await prisma_1.default.problemProgress.findUnique({
                where: {
                    userId_problemId: {
                        userId: req.user.id,
                        problemId: problem.id,
                    },
                },
            });
        }
        res.json({
            problem,
            userProgress: userProgress ? { solved: userProgress.solved, bestScore: userProgress.bestScore } : null,
        });
    }
    catch (error) {
        console.error('getProblemByCodeOrId error:', error);
        res.status(500).json({ error: 'Failed to retrieve problem details.' });
    }
};
exports.getProblemByCodeOrId = getProblemByCodeOrId;
/**
 * Admin: Get problem details including hidden test cases
 */
const getAdminProblemById = async (req, res) => {
    try {
        const { id } = req.params;
        const problem = await prisma_1.default.problem.findUnique({
            where: { id },
            include: {
                sampleTestCases: {
                    orderBy: { displayOrder: 'asc' },
                },
                hiddenTestCases: {
                    orderBy: { pointsOrWeight: 'desc' },
                },
                _count: {
                    select: { submissions: true },
                },
            },
        });
        if (!problem) {
            res.status(404).json({ error: 'Problem not found.' });
            return;
        }
        res.json({ problem });
    }
    catch (error) {
        console.error('getAdminProblemById error:', error);
        res.status(500).json({ error: 'Failed to retrieve admin problem details.' });
    }
};
exports.getAdminProblemById = getAdminProblemById;
/**
 * Admin: Create a new problem
 */
const createProblem = async (req, res) => {
    try {
        const { problemCode, title, description, academicYear, topic, difficulty, points = 100, inputFormat, outputFormat, constraints, timeLimit = 2.0, memoryLimit = 256, isPublished = true, starterCodeC, starterCodeCpp, starterCodeJava, starterCodePython, sampleTestCases = [], hiddenTestCases = [], } = req.body;
        if (!title || !description || !academicYear || !topic || !difficulty) {
            res.status(400).json({ error: 'Title, description, academic year, topic, and difficulty are required.' });
            return;
        }
        // Generate problem code if not provided
        let finalCode = problemCode ? problemCode.trim().toUpperCase() : '';
        if (!finalCode) {
            const prefix = topic.substring(0, 3).toUpperCase();
            const count = await prisma_1.default.problem.count({ where: { topic } });
            finalCode = `${prefix}-${(count + 1).toString().padStart(3, '0')}`;
        }
        // Ensure code uniqueness
        const existing = await prisma_1.default.problem.findUnique({ where: { problemCode: finalCode } });
        if (existing) {
            finalCode = `${finalCode}-${Date.now().toString().slice(-4)}`;
        }
        const problem = await prisma_1.default.problem.create({
            data: {
                problemCode: finalCode,
                title: title.trim(),
                description,
                academicYear,
                topic: topic.trim(),
                difficulty,
                points: parseInt(points, 10) || 100,
                inputFormat: inputFormat || '',
                outputFormat: outputFormat || '',
                constraints: constraints || '',
                timeLimit: parseFloat(timeLimit) || 2.0,
                memoryLimit: parseInt(memoryLimit, 10) || 256,
                isPublished: Boolean(isPublished),
                starterCodeC: starterCodeC || null,
                starterCodeCpp: starterCodeCpp || null,
                starterCodeJava: starterCodeJava || null,
                starterCodePython: starterCodePython || null,
                sampleTestCases: {
                    create: (sampleTestCases || []).map((stc, index) => ({
                        inputData: stc.inputData || '',
                        expectedOutput: stc.expectedOutput || '',
                        explanation: stc.explanation || null,
                        displayOrder: stc.displayOrder || index + 1,
                    })),
                },
                hiddenTestCases: {
                    create: (hiddenTestCases || []).map((htc) => ({
                        inputData: htc.inputData || '',
                        expectedOutput: htc.expectedOutput || '',
                        pointsOrWeight: parseInt(htc.pointsOrWeight, 10) || 1,
                    })),
                },
            },
            include: {
                sampleTestCases: true,
                hiddenTestCases: true,
            },
        });
        res.status(201).json({
            message: 'Problem created successfully.',
            problem,
        });
    }
    catch (error) {
        console.error('createProblem error:', error);
        res.status(500).json({ error: error.message || 'Failed to create problem.' });
    }
};
exports.createProblem = createProblem;
/**
 * Admin: Update problem
 */
const updateProblem = async (req, res) => {
    try {
        const { id } = req.params;
        const { problemCode, title, description, academicYear, topic, difficulty, points, inputFormat, outputFormat, constraints, timeLimit, memoryLimit, isPublished, starterCodeC, starterCodeCpp, starterCodeJava, starterCodePython, sampleTestCases, hiddenTestCases, } = req.body;
        const existing = await prisma_1.default.problem.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ error: 'Problem not found.' });
            return;
        }
        // Update main fields
        await prisma_1.default.problem.update({
            where: { id },
            data: {
                problemCode: problemCode ? problemCode.trim().toUpperCase() : existing.problemCode,
                title: title ? title.trim() : existing.title,
                description: description !== undefined ? description : existing.description,
                academicYear: academicYear || existing.academicYear,
                topic: topic ? topic.trim() : existing.topic,
                difficulty: difficulty || existing.difficulty,
                points: points !== undefined ? parseInt(points, 10) : existing.points,
                inputFormat: inputFormat !== undefined ? inputFormat : existing.inputFormat,
                outputFormat: outputFormat !== undefined ? outputFormat : existing.outputFormat,
                constraints: constraints !== undefined ? constraints : existing.constraints,
                timeLimit: timeLimit !== undefined ? parseFloat(timeLimit) : existing.timeLimit,
                memoryLimit: memoryLimit !== undefined ? parseInt(memoryLimit, 10) : existing.memoryLimit,
                isPublished: isPublished !== undefined ? Boolean(isPublished) : existing.isPublished,
                starterCodeC: starterCodeC !== undefined ? starterCodeC : existing.starterCodeC,
                starterCodeCpp: starterCodeCpp !== undefined ? starterCodeCpp : existing.starterCodeCpp,
                starterCodeJava: starterCodeJava !== undefined ? starterCodeJava : existing.starterCodeJava,
                starterCodePython: starterCodePython !== undefined ? starterCodePython : existing.starterCodePython,
            },
        });
        // Update sample test cases if provided
        if (Array.isArray(sampleTestCases)) {
            await prisma_1.default.sampleTestCase.deleteMany({ where: { problemId: id } });
            if (sampleTestCases.length > 0) {
                await prisma_1.default.sampleTestCase.createMany({
                    data: sampleTestCases.map((stc, index) => ({
                        problemId: id,
                        inputData: stc.inputData || '',
                        expectedOutput: stc.expectedOutput || '',
                        explanation: stc.explanation || null,
                        displayOrder: stc.displayOrder || index + 1,
                    })),
                });
            }
        }
        // Update hidden test cases if provided
        if (Array.isArray(hiddenTestCases)) {
            await prisma_1.default.hiddenTestCase.deleteMany({ where: { problemId: id } });
            if (hiddenTestCases.length > 0) {
                await prisma_1.default.hiddenTestCase.createMany({
                    data: hiddenTestCases.map((htc) => ({
                        problemId: id,
                        inputData: htc.inputData || '',
                        expectedOutput: htc.expectedOutput || '',
                        pointsOrWeight: parseInt(htc.pointsOrWeight, 10) || 1,
                    })),
                });
            }
        }
        const updated = await prisma_1.default.problem.findUnique({
            where: { id },
            include: {
                sampleTestCases: { orderBy: { displayOrder: 'asc' } },
                hiddenTestCases: true,
            },
        });
        res.json({
            message: 'Problem updated successfully.',
            problem: updated,
        });
    }
    catch (error) {
        console.error('updateProblem error:', error);
        res.status(500).json({ error: error.message || 'Failed to update problem.' });
    }
};
exports.updateProblem = updateProblem;
/**
 * Admin: Delete problem
 */
const deleteProblem = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await prisma_1.default.problem.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ error: 'Problem not found.' });
            return;
        }
        await prisma_1.default.problem.delete({ where: { id } });
        res.json({ message: `Problem "${existing.title}" deleted successfully.` });
    }
    catch (error) {
        console.error('deleteProblem error:', error);
        res.status(500).json({ error: 'Failed to delete problem.' });
    }
};
exports.deleteProblem = deleteProblem;
/**
 * Admin: Toggle publication status
 */
const togglePublish = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await prisma_1.default.problem.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ error: 'Problem not found.' });
            return;
        }
        const updated = await prisma_1.default.problem.update({
            where: { id },
            data: { isPublished: !existing.isPublished },
        });
        res.json({
            message: `Problem ${updated.isPublished ? 'published' : 'unpublished'} successfully.`,
            isPublished: updated.isPublished,
        });
    }
    catch (error) {
        console.error('togglePublish error:', error);
        res.status(500).json({ error: 'Failed to change publication status.' });
    }
};
exports.togglePublish = togglePublish;
/**
 * Admin: Export all problems with test cases as JSON
 */
const exportProblems = async (req, res) => {
    try {
        const problems = await prisma_1.default.problem.findMany({
            include: {
                sampleTestCases: true,
                hiddenTestCases: true,
            },
        });
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="code_arena_questions.json"');
        res.json(problems);
    }
    catch (error) {
        console.error('exportProblems error:', error);
        res.status(500).json({ error: 'Failed to export problems.' });
    }
};
exports.exportProblems = exportProblems;
/**
 * Admin: Import problems from JSON
 */
const importProblems = async (req, res) => {
    try {
        const items = req.body;
        if (!Array.isArray(items) || items.length === 0) {
            res.status(400).json({ error: 'Invalid JSON. Must be an array of problem objects.' });
            return;
        }
        let createdCount = 0;
        for (const item of items) {
            if (!item.title || !item.description)
                continue;
            let code = item.problemCode || `PRB-${Date.now().toString().slice(-4)}`;
            const existing = await prisma_1.default.problem.findUnique({ where: { problemCode: code } });
            if (existing) {
                code = `${code}-${Math.floor(Math.random() * 1000)}`;
            }
            await prisma_1.default.problem.create({
                data: {
                    problemCode: code,
                    title: item.title,
                    description: item.description,
                    academicYear: item.academicYear || '1st Year',
                    topic: item.topic || 'General',
                    difficulty: item.difficulty || 'Easy',
                    points: item.points || 100,
                    inputFormat: item.inputFormat || '',
                    outputFormat: item.outputFormat || '',
                    constraints: item.constraints || '',
                    timeLimit: item.timeLimit || 2.0,
                    memoryLimit: item.memoryLimit || 256,
                    isPublished: item.isPublished !== undefined ? item.isPublished : true,
                    starterCodeC: item.starterCodeC || null,
                    starterCodeCpp: item.starterCodeCpp || null,
                    starterCodeJava: item.starterCodeJava || null,
                    starterCodePython: item.starterCodePython || null,
                    sampleTestCases: {
                        create: (item.sampleTestCases || []).map((s, idx) => ({
                            inputData: s.inputData || '',
                            expectedOutput: s.expectedOutput || '',
                            explanation: s.explanation || null,
                            displayOrder: s.displayOrder || idx + 1,
                        })),
                    },
                    hiddenTestCases: {
                        create: (item.hiddenTestCases || []).map((h) => ({
                            inputData: h.inputData || '',
                            expectedOutput: h.expectedOutput || '',
                            pointsOrWeight: h.pointsOrWeight || 1,
                        })),
                    },
                },
            });
            createdCount++;
        }
        res.json({ message: `Successfully imported ${createdCount} problems.` });
    }
    catch (error) {
        console.error('importProblems error:', error);
        res.status(500).json({ error: error.message || 'Failed to import problems.' });
    }
};
exports.importProblems = importProblems;
