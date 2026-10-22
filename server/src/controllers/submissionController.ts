import { Response } from 'express';
import prisma from '../db/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { judgeService } from '../services/judgeService';
import { SupportedLanguage } from '../types';

/**
 * Run Code: Test against sample cases or custom input
 */
export const runCode = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { problemId, language, sourceCode, customInput } = req.body;

    if (!language || !sourceCode) {
      res.status(400).json({ error: 'Language and source code are required.' });
      return;
    }

    const validLanguages: SupportedLanguage[] = ['c', 'cpp', 'java', 'python'];
    if (!validLanguages.includes(language as SupportedLanguage)) {
      res.status(400).json({ error: `Unsupported language: ${language}. Choose from c, cpp, java, python.` });
      return;
    }

    // 1. If custom input is provided, run single execution
    if (typeof customInput === 'string' && customInput.trim() !== '') {
      const result = await judgeService.execute(language as SupportedLanguage, sourceCode, customInput);

      let status = 'Success';
      let error = null;

      if (result.status.id === 6 || result.compile_output) {
        status = 'Compilation Error';
        error = result.compile_output || result.stderr;
      } else if (result.status.id === 5) {
        status = 'Time Limit Exceeded';
        error = 'Execution exceeded time limit.';
      } else if (result.status.id !== 3 && result.stderr) {
        status = 'Runtime Error';
        error = result.stderr;
      }

      res.json({
        isCustomInput: true,
        status,
        input: customInput,
        actualOutput: result.stdout || '',
        errorMessage: error,
        executionTime: typeof result.time === 'number' ? result.time : parseFloat(result.time as string) || 0,
      });
      return;
    }

    // 2. Run against problem's sample test cases (BATCH)
    if (!problemId) {
      res.status(400).json({ error: 'problemId is required when no custom input is provided.' });
      return;
    }

    const problem = await prisma.problem.findUnique({
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
      const result = await judgeService.execute(language as SupportedLanguage, sourceCode, '');
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
            executionTime: parseFloat(result.time as string) || 0,
            errorMessage: result.compile_output || result.stderr || null,
          },
        ],
      });
      return;
    }

    // ── BATCH EXECUTION: All sample cases at once ──
    const batchInputs = testCases.map((tc) => ({ input: tc.inputData }));
    const batchResults = await judgeService.executeBatch(
      language as SupportedLanguage,
      sourceCode,
      batchInputs,
      problem.timeLimit,
      problem.memoryLimit
    );

    const results = [];
    let allPassed = true;
    let compilationError = false;

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const result = batchResults[i];

      // Compilation error
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
          executionTime: parseFloat(result.time as string) || 0,
          errorMessage: result.stderr,
        });
        allPassed = false;
        continue;
      }

      const normalizedActual = judgeService.normalizeOutput(result.stdout);
      const normalizedExpected = judgeService.normalizeOutput(tc.expectedOutput);
      const passed = normalizedActual === normalizedExpected;

      if (!passed) allPassed = false;

      results.push({
        testCaseIndex: i + 1,
        input: tc.inputData,
        expectedOutput: tc.expectedOutput,
        actualOutput: result.stdout || '',
        status: passed ? 'Passed' : 'Wrong Answer',
        passed,
        executionTime: parseFloat(result.time as string) || 0,
        errorMessage: null,
      });
    }

    res.json({
      isCustomInput: false,
      allPassed,
      compilationError,
      status: compilationError ? 'COMPILATION ERROR' : allPassed ? 'ALL SAMPLE CASES PASSED' : 'SOME CASES FAILED',
      results,
    });
  } catch (error: any) {
    console.error('runCode error:', error);
    res.status(500).json({ error: error.message || 'Execution error.' });
  }
};

/**
 * Submit Code: Evaluates against hidden test cases, records score & progress
 */
export const submitCode = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

    const validLanguages: SupportedLanguage[] = ['c', 'cpp', 'java', 'python'];
    if (!validLanguages.includes(language as SupportedLanguage)) {
      res.status(400).json({ error: `Unsupported language: ${language}. Choose from c, cpp, java, python.` });
      return;
    }

    // Retrieve problem and hidden test cases
    const problem = await prisma.problem.findUnique({
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
    const testCasesToEvaluate =
      problem.hiddenTestCases.length > 0
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
    let overallStatus: 'Accepted' | 'Wrong Answer' | 'Compilation Error' | 'Runtime Error' | 'Time Limit Exceeded' = 'Accepted';
    let errorMessage: string | null = null;
    let maxExecutionTime = 0;

    // ── BATCH EXECUTION: All hidden test cases at once ──
    const batchInputs = testCasesToEvaluate.map((tc) => ({ input: tc.inputData }));
    const batchResults = await judgeService.executeBatch(
      language as SupportedLanguage,
      sourceCode,
      batchInputs,
      problem.timeLimit,
      problem.memoryLimit
    );

    // Evaluation item summary for student (WITHOUT exposing hidden test inputs/outputs!)
    const caseSummaries = [];

    for (let i = 0; i < totalTestCases; i++) {
      const tc = testCasesToEvaluate[i];
      const result = batchResults[i];

      const caseTime = parseFloat(result.time as string) || 0;
      if (caseTime > maxExecutionTime) maxExecutionTime = caseTime;

      // 1. Compilation Error
      if (result.status.id === 6 || result.compile_output) {
        overallStatus = 'Compilation Error';
        errorMessage = result.compile_output || result.stderr || 'Compilation error occurred.';
        caseSummaries.push({
          testCaseIndex: i + 1, passed: false,
          status: 'Compilation Error', executionTime: 0,
        });
        break;
      }

      // 2. Time Limit Exceeded
      if (result.status.id === 5) {
        if (overallStatus === 'Accepted') overallStatus = 'Time Limit Exceeded';
        caseSummaries.push({
          testCaseIndex: i + 1, passed: false,
          status: 'Time Limit Exceeded', executionTime: problem.timeLimit,
        });
        continue;
      }

      // 3. Runtime Error
      if (result.status.id !== 3 && result.stderr) {
        if (overallStatus === 'Accepted') overallStatus = 'Runtime Error';
        if (!errorMessage) errorMessage = result.stderr;
        caseSummaries.push({
          testCaseIndex: i + 1, passed: false,
          status: 'Runtime Error', executionTime: caseTime,
        });
        continue;
      }

      // 4. Output verification
      const normalizedActual = judgeService.normalizeOutput(result.stdout);
      const normalizedExpected = judgeService.normalizeOutput(tc.expectedOutput);
      const passed = normalizedActual === normalizedExpected;

      if (passed) {
        passedTestCases++;
        caseSummaries.push({
          testCaseIndex: i + 1, passed: true,
          status: 'Passed', executionTime: caseTime,
        });
      } else {
        if (overallStatus === 'Accepted') overallStatus = 'Wrong Answer';
        caseSummaries.push({
          testCaseIndex: i + 1, passed: false,
          status: 'Wrong Answer', executionTime: caseTime,
        });
      }
    }

    // Calculate score
    let pointsEarned = 0;
    if (totalTestCases > 0) {
      if (overallStatus === 'Accepted' && passedTestCases === totalTestCases) {
        pointsEarned = problem.points;
      } else {
        pointsEarned = Math.floor((passedTestCases / totalTestCases) * problem.points);
      }
    }

    // Record submission in database
    const submission = await prisma.submission.create({
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

    const existingProgress = await prisma.problemProgress.findUnique({
      where: {
        userId_problemId: {
          userId: req.user.id,
          problemId: problem.id,
        },
      },
    });

    if (existingProgress) {
      await prisma.problemProgress.update({
        where: { id: existingProgress.id },
        data: {
          solved: existingProgress.solved || isFullySolved,
          bestScore: Math.max(existingProgress.bestScore, pointsEarned),
          attempts: existingProgress.attempts + 1,
        },
      });
    } else {
      await prisma.problemProgress.create({
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
  } catch (error: any) {
    console.error('submitCode error:', error);
    res.status(500).json({ error: error.message || 'Submission evaluation error.' });
  }
};

/**
 * Get Submissions of current student
 */
export const getUserSubmissions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated.' });
      return;
    }

    const { page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;

    const [total, submissions] = await Promise.all([
      prisma.submission.count({ where: { userId: req.user.id } }),
      prisma.submission.findMany({
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
  } catch (error: any) {
    console.error('getUserSubmissions error:', error);
    res.status(500).json({ error: 'Failed to retrieve submissions.' });
  }
};

/**
 * Get Submissions for a specific problem by current student
 */
export const getProblemSubmissions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated.' });
      return;
    }

    const { problemId } = req.params;

    const submissions = await prisma.submission.findMany({
      where: {
        userId: req.user.id,
        problemId,
      },
      orderBy: { submittedAt: 'desc' },
      take: 20,
    });

    res.json({ submissions });
  } catch (error: any) {
    console.error('getProblemSubmissions error:', error);
    res.status(500).json({ error: 'Failed to retrieve submissions for problem.' });
  }
};

/**
 * Admin: View all submissions across platform
 */
export const getAllSubmissions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status, language, academicYear, page = '1', limit = '30' } = req.query;

    const where: any = {};
    if (status && status !== 'All') where.status = status;
    if (language && language !== 'All') where.language = language;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 30;

    const [total, submissions] = await Promise.all([
      prisma.submission.count({ where }),
      prisma.submission.findMany({
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
  } catch (error: any) {
    console.error('getAllSubmissions error:', error);
    res.status(500).json({ error: 'Failed to retrieve admin submissions.' });
  }
};
