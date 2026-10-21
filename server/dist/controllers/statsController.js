"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminStats = exports.getStudentDashboardStats = exports.getLeaderboard = void 0;
const prisma_1 = __importDefault(require("../db/prisma"));
/**
 * Leaderboard: Rankings based on points earned and problems solved
 */
const getLeaderboard = async (req, res) => {
    try {
        const { year } = req.query;
        const userWhere = { role: 'STUDENT' };
        if (year && typeof year === 'string' && year !== 'All') {
            userWhere.academicYear = year;
        }
        const students = await prisma_1.default.user.findMany({
            where: userWhere,
            select: {
                id: true,
                name: true,
                academicYear: true,
                progress: {
                    select: {
                        solved: true,
                        bestScore: true,
                    },
                },
                submissions: {
                    take: 1,
                    orderBy: { submittedAt: 'desc' },
                    select: { submittedAt: true },
                },
            },
        });
        const leaderboard = students
            .map((student) => {
            const solvedCount = student.progress.filter((p) => p.solved).length;
            const totalPoints = student.progress.reduce((acc, p) => acc + (p.bestScore || 0), 0);
            const lastActive = student.submissions[0]?.submittedAt || null;
            return {
                id: student.id,
                name: student.name,
                academicYear: student.academicYear,
                solvedCount,
                totalPoints,
                lastActive,
            };
        })
            .filter((s) => s.totalPoints > 0 || s.solvedCount > 0)
            .sort((a, b) => {
            if (b.totalPoints !== a.totalPoints) {
                return b.totalPoints - a.totalPoints;
            }
            if (b.solvedCount !== a.solvedCount) {
                return b.solvedCount - a.solvedCount;
            }
            return 0;
        })
            .map((item, index) => ({
            rank: index + 1,
            ...item,
        }));
        res.json({ leaderboard });
    }
    catch (error) {
        console.error('getLeaderboard error:', error);
        res.status(500).json({ error: 'Failed to retrieve leaderboard.' });
    }
};
exports.getLeaderboard = getLeaderboard;
/**
 * Student Dashboard Stats: Detailed personal analytics
 */
const getStudentDashboardStats = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated.' });
            return;
        }
        const userId = req.user.id;
        // Get all published problems
        const allProblems = await prisma_1.default.problem.findMany({
            where: { isPublished: true },
            select: {
                id: true,
                academicYear: true,
                topic: true,
                difficulty: true,
                points: true,
            },
        });
        // Get user progress
        const userProgress = await prisma_1.default.problemProgress.findMany({
            where: { userId },
        });
        // Get user submissions
        const recentSubmissions = await prisma_1.default.submission.findMany({
            where: { userId },
            include: {
                problem: {
                    select: {
                        id: true,
                        problemCode: true,
                        title: true,
                        difficulty: true,
                    },
                },
            },
            orderBy: { submittedAt: 'desc' },
            take: 6,
        });
        const solvedProgressMap = new Map();
        userProgress.forEach((p) => {
            solvedProgressMap.set(p.problemId, { solved: p.solved, bestScore: p.bestScore });
        });
        let totalPoints = 0;
        let solvedCount = 0;
        let attemptedCount = userProgress.length;
        // Year-wise stats
        const yearStats = {
            '1st Year': { total: 0, solved: 0 },
            '2nd Year': { total: 0, solved: 0 },
            '3rd Year': { total: 0, solved: 0 },
        };
        // Topic stats
        const topicStats = {};
        // Difficulty stats
        const difficultyStats = {
            Easy: { total: 0, solved: 0 },
            Medium: { total: 0, solved: 0 },
            Hard: { total: 0, solved: 0 },
        };
        allProblems.forEach((prob) => {
            const year = prob.academicYear;
            if (yearStats[year]) {
                yearStats[year].total++;
            }
            if (!topicStats[prob.topic]) {
                topicStats[prob.topic] = { total: 0, solved: 0 };
            }
            topicStats[prob.topic].total++;
            if (difficultyStats[prob.difficulty]) {
                difficultyStats[prob.difficulty].total++;
            }
            const prog = solvedProgressMap.get(prob.id);
            if (prog && prog.solved) {
                solvedCount++;
                totalPoints += prog.bestScore;
                if (yearStats[year])
                    yearStats[year].solved++;
                topicStats[prob.topic].solved++;
                if (difficultyStats[prob.difficulty])
                    difficultyStats[prob.difficulty].solved++;
            }
        });
        res.json({
            totalProblems: allProblems.length,
            solvedCount,
            attemptedCount,
            totalPoints,
            yearStats,
            topicStats,
            difficultyStats,
            recentSubmissions,
        });
    }
    catch (error) {
        console.error('getStudentDashboardStats error:', error);
        res.status(500).json({ error: 'Failed to retrieve dashboard stats.' });
    }
};
exports.getStudentDashboardStats = getStudentDashboardStats;
/**
 * Admin: Platform Analytics
 */
const getAdminStats = async (req, res) => {
    try {
        const [totalUsers, totalStudents, totalProblems, publishedProblems, totalSubmissions, acceptedSubmissions, submissionsByLanguage, recentSubmissions,] = await Promise.all([
            prisma_1.default.user.count(),
            prisma_1.default.user.count({ where: { role: 'STUDENT' } }),
            prisma_1.default.problem.count(),
            prisma_1.default.problem.count({ where: { isPublished: true } }),
            prisma_1.default.submission.count(),
            prisma_1.default.submission.count({ where: { status: 'Accepted' } }),
            prisma_1.default.submission.groupBy({
                by: ['language'],
                _count: { id: true },
            }),
            prisma_1.default.submission.findMany({
                take: 10,
                orderBy: { submittedAt: 'desc' },
                include: {
                    user: { select: { name: true, email: true, academicYear: true } },
                    problem: { select: { title: true, problemCode: true } },
                },
            }),
        ]);
        const passRate = totalSubmissions > 0 ? Math.round((acceptedSubmissions / totalSubmissions) * 100) : 0;
        res.json({
            totalUsers,
            totalStudents,
            totalProblems,
            publishedProblems,
            totalSubmissions,
            acceptedSubmissions,
            passRate,
            languageDistribution: submissionsByLanguage.map((item) => ({
                language: item.language,
                count: item._count.id,
            })),
            recentSubmissions,
        });
    }
    catch (error) {
        console.error('getAdminStats error:', error);
        res.status(500).json({ error: 'Failed to retrieve admin stats.' });
    }
};
exports.getAdminStats = getAdminStats;
