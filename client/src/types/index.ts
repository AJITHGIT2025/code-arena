export type SupportedLanguage = 'c' | 'cpp' | 'java' | 'python';

export type AcademicYear = '1st Year' | '2nd Year' | '3rd Year';

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'ADMIN';
  academicYear: string;
}

export interface SampleTestCase {
  id?: string;
  problemId?: string;
  inputData: string;
  expectedOutput: string;
  explanation?: string | null;
  displayOrder?: number;
}

export interface HiddenTestCase {
  id?: string;
  problemId?: string;
  inputData: string;
  expectedOutput: string;
  pointsOrWeight: number;
}

export interface Problem {
  id: string;
  problemCode: string;
  title: string;
  description: string;
  academicYear: AcademicYear;
  topic: string;
  difficulty: DifficultyLevel;
  points: number;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  timeLimit: number;
  memoryLimit: number;
  isPublished: boolean;
  starterCodeC?: string | null;
  starterCodeCpp?: string | null;
  starterCodeJava?: string | null;
  starterCodePython?: string | null;
  sampleTestCases?: SampleTestCase[];
  hiddenTestCases?: HiddenTestCase[];
  solved?: boolean;
  bestScore?: number;
  totalSubmissions?: number;
  createdAt?: string;
}

export interface Submission {
  id: string;
  userId: string;
  problemId: string;
  language: SupportedLanguage;
  sourceCode: string;
  status: 'Accepted' | 'Wrong Answer' | 'Compilation Error' | 'Runtime Error' | 'Time Limit Exceeded';
  passedTestCases: number;
  totalTestCases: number;
  pointsEarned: number;
  executionTime?: number;
  errorMessage?: string | null;
  submittedAt: string;
  problem?: {
    id: string;
    problemCode: string;
    title: string;
    academicYear?: string;
    difficulty?: string;
    points?: number;
  };
  user?: {
    id: string;
    name: string;
    email: string;
    academicYear: string;
  };
}

export interface RunCaseResult {
  testCaseIndex: number;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  status: string;
  passed: boolean;
  executionTime: number;
  errorMessage?: string | null;
}

export interface SubmitResult {
  submissionId: string;
  status: 'Accepted' | 'Wrong Answer' | 'Compilation Error' | 'Runtime Error' | 'Time Limit Exceeded';
  passedTestCases: number;
  totalTestCases: number;
  pointsEarned: number;
  totalPoints: number;
  executionTime: number;
  errorMessage?: string | null;
  cases: {
    testCaseIndex: number;
    passed: boolean;
    status: string;
    executionTime?: number;
  }[];
  solved: boolean;
}
