import { Response } from 'express';
import prisma from '../db/prisma';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * Leaderboard: Rankings based on points earned and problems solved
 */
export const getLeaderboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { year } = req.query;

    const userWhere: any = { role: 'STUDENT' };
    if (year && typeof year === 'string' && year !== 'All') {
      userWhere.academicYear = year;
    }

    const students = await prisma.user.findMany({
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
  } catch (error: any) {
    console.error('getLeaderboard error:', error);
    res.status(500).json({ error: 'Failed to retrieve leaderboard.' });
  }
};

/**
 * Student Dashboard Stats: Detailed personal analytics
 */
export const getStudentDashboardStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated.' });
      return;
    }

    const userId = req.user.id;

    // Get all published problems
    const allProblems = await prisma.problem.findMany({
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
    const userProgress = await prisma.problemProgress.findMany({
      where: { userId },
    });

    // Get user submissions
    const recentSubmissions = await prisma.submission.findMany({
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

    const solvedProgressMap = new Map<string, { solved: boolean; bestScore: number }>();
    userProgress.forEach((p) => {
      solvedProgressMap.set(p.problemId, { solved: p.solved, bestScore: p.bestScore });
    });

    let totalPoints = 0;
    let solvedCount = 0;
    let attemptedCount = userProgress.length;

    // Year-wise stats
    const yearStats: Record<string, { total: number; solved: number }> = {
      '1st Year': { total: 0, solved: 0 },
      '2nd Year': { total: 0, solved: 0 },
      '3rd Year': { total: 0, solved: 0 },
    };

    // Topic stats
    const topicStats: Record<string, { total: number; solved: number }> = {};

    // Difficulty stats
    const difficultyStats: Record<string, { total: number; solved: number }> = {
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
        if (yearStats[year]) yearStats[year].solved++;
        topicStats[prob.topic].solved++;
        if (difficultyStats[prob.difficulty]) difficultyStats[prob.difficulty].solved++;
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
  } catch (error: any) {
    console.error('getStudentDashboardStats error:', error);
    res.status(500).json({ error: 'Failed to retrieve dashboard stats.' });
  }
};

/**
 * Admin: Platform Analytics
 */
export const getAdminStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const [
      totalUsers,
      totalStudents,
      totalProblems,
      publishedProblems,
      totalSubmissions,
      acceptedSubmissions,
      submissionsByLanguage,
      recentSubmissions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.problem.count(),
      prisma.problem.count({ where: { isPublished: true } }),
      prisma.submission.count(),
      prisma.submission.count({ where: { status: 'Accepted' } }),
      prisma.submission.groupBy({
        by: ['language'],
        _count: { id: true },
      }),
      prisma.submission.findMany({
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
  } catch (error: any) {
    console.error('getAdminStats error:', error);
    res.status(500).json({ error: 'Failed to retrieve admin stats.' });
  }
};
