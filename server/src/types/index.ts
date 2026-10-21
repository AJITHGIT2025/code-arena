export type SupportedLanguage = 'c' | 'cpp' | 'java' | 'python';

export type UserRole = 'STUDENT' | 'ADMIN';

export type AcademicYear = '1st Year' | '2nd Year' | '3rd Year';

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  academicYear: string;
}

export interface JudgeExecutionResult {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  status: {
    id: number;
    description: string;
  };
  time: string | number | null;
  memory: number | null;
  message?: string | null;
}

export interface EvaluationItem {
  testCaseIndex: number;
  passed: boolean;
  input?: string;
  expectedOutput?: string;
  actualOutput?: string;
  status: string;
  executionTime?: number;
  errorMessage?: string;
}

export interface SubmissionEvaluationSummary {
  status: 'Accepted' | 'Wrong Answer' | 'Compilation Error' | 'Runtime Error' | 'Time Limit Exceeded' | 'Internal Error';
  passedTestCases: number;
  totalTestCases: number;
  pointsEarned: number;
  executionTime: number;
  executionMemory?: number;
  errorMessage?: string;
  details: {
    testCaseIndex: number;
    passed: boolean;
    status: string;
    executionTime?: number;
  }[];
}
