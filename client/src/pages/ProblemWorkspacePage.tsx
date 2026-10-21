import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import confetti from 'canvas-confetti';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Problem, SupportedLanguage, RunCaseResult, SubmitResult, Submission } from '../types';
import { DifficultyBadge, YearBadge, StatusBadge } from '../components/Badge';
import {
  Play,
  Send,
  RotateCcw,
  FileText,
  History,
  Copy,
  Check,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

const DEFAULT_STARTER_CODE: Record<SupportedLanguage, string> = {
  c: `#include <stdio.h>

int main() {
    // Write your C solution here
    int a, b;
    if (scanf("%d %d", &a, &b) == 2) {
        printf("%d\\n", a + b);
    }
    return 0;
}`,
  cpp: `#include <iostream>
using namespace std;

int main() {
    // Write your C++ solution here
    int a, b;
    if (cin >> a >> b) {
        cout << (a + b) << endl;
    }
    return 0;
}`,
  java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        // Write your Java solution here
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextInt()) {
            int a = sc.nextInt();
            int b = sc.nextInt();
            System.out.println(a + b);
        }
        sc.close();
    }
}`,
  python: `import sys

def main():
    # Write your Python solution here
    data = sys.stdin.read().split()
    if len(data) >= 2:
        a = int(data[0])
        b = int(data[1])
        print(a + b)

if __name__ == '__main__':
    main()`,
};

export const ProblemWorkspacePage: React.FC = () => {
  const { codeOrId } = useParams<{ codeOrId: string }>();
  const { isAuthenticated } = useAuth();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'description' | 'submissions'>('description');
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  // Editor states
  const [language, setLanguage] = useState<SupportedLanguage>('python');
  const [sourceCode, setSourceCode] = useState<string>('');

  // Execution states
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [useCustomInput, setUseCustomInput] = useState(false);
  const [customInput, setCustomInput] = useState('');

  // Results state
  const [bottomTab, setBottomTab] = useState<'testcase' | 'runResult' | 'submitResult'>('testcase');
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0);
  const [runResults, setRunResults] = useState<RunCaseResult[] | null>(null);
  const [customRunResult, setCustomRunResult] = useState<any | null>(null);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);

  // Copy indicator
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [guestModalOpen, setGuestModalOpen] = useState(false);

  useEffect(() => {
    fetchProblemDetails();
  }, [codeOrId]);

  const fetchProblemDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/problems/${codeOrId}`);
      const prob: Problem = res.data.problem;
      setProblem(prob);

      updateCodeForLanguage(language, prob);

      if (isAuthenticated && prob.id) {
        fetchSubmissions(prob.id);
      }
    } catch (err) {
      console.error('Failed to load problem:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async (problemId: string) => {
    try {
      const res = await api.get(`/submissions/problem/${problemId}`);
      setSubmissions(res.data.submissions || []);
    } catch (err) {
      console.error('Failed to load problem submissions:', err);
    }
  };

  const updateCodeForLanguage = (lang: SupportedLanguage, prob: Problem | null = problem) => {
    if (!prob) return;
    let starter = '';
    if (lang === 'c') starter = prob.starterCodeC || DEFAULT_STARTER_CODE.c;
    else if (lang === 'cpp') starter = prob.starterCodeCpp || DEFAULT_STARTER_CODE.cpp;
    else if (lang === 'java') starter = prob.starterCodeJava || DEFAULT_STARTER_CODE.java;
    else if (lang === 'python') starter = prob.starterCodePython || DEFAULT_STARTER_CODE.python;

    setSourceCode(starter);
  };

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    updateCodeForLanguage(newLang);
  };

  const handleResetCode = () => {
    if (window.confirm('Reset code to the original starter template?')) {
      updateCodeForLanguage(language);
    }
  };

  const handleCopyInput = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleRunCode = async () => {
    if (!problem) return;
    setRunning(true);
    setRunResults(null);
    setCustomRunResult(null);

    try {
      const payload: any = {
        problemId: problem.id,
        language,
        sourceCode,
      };

      if (useCustomInput) {
        payload.customInput = customInput;
      }

      const res = await api.post('/submissions/run', payload);

      if (useCustomInput) {
        setCustomRunResult(res.data);
      } else {
        setRunResults(res.data.results || []);
        setSelectedCaseIdx(0);
      }
      setBottomTab('runResult');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Execution failed.');
    } finally {
      setRunning(false);
    }
  };

  const handleSubmitCode = async () => {
    if (!isAuthenticated) {
      setGuestModalOpen(true);
      return;
    }

    if (!problem) return;
    setSubmitting(true);
    setSubmitResult(null);

    try {
      const res = await api.post('/submissions/submit', {
        problemId: problem.id,
        language,
        sourceCode,
      });

      const data: SubmitResult = res.data;
      setSubmitResult(data);
      setBottomTab('submitResult');

      if (data.solved || data.status === 'Accepted') {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      fetchSubmissions(problem.id);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center text-slate-400 text-sm">
        Loading coding workspace...
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="min-h-screen bg-[#0a0d14] flex flex-col items-center justify-center text-slate-400 text-sm">
        <p className="text-base text-white font-semibold mb-2">Problem Not Found</p>
        <Link to="/problems" className="text-blue-400 hover:underline">
          Return to problem list
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0a0d14] flex flex-col">
      {/* Workspace Subheader */}
      <div className="bg-[#0f1422] border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-3">
          <Link to="/problems" className="text-slate-400 hover:text-white flex items-center space-x-1">
            <span>Problems</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
          <span className="font-mono font-bold text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded">
            {problem.problemCode}
          </span>
          <span className="font-bold text-white max-w-xs sm:max-w-md truncate">{problem.title}</span>
          <YearBadge year={problem.academicYear} />
          <DifficultyBadge difficulty={problem.difficulty} />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-slate-400">Score:</span>
          <span className="font-bold text-blue-400">{problem.points} pts</span>
        </div>
      </div>

      {/* Main Split Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
        {/* Left Column: Problem Details & Tabs (5 cols) */}
        <div className="lg:col-span-5 border-r border-slate-800 flex flex-col bg-[#0b0e17] overflow-y-auto max-h-[calc(100vh-112px)]">
          <div className="flex border-b border-slate-800/90 bg-[#0e121d] px-4">
            <button
              onClick={() => setActiveTab('description')}
              className={`flex items-center space-x-2 py-3 px-3 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'description'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Problem Description</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('submissions');
                if (problem.id) fetchSubmissions(problem.id);
              }}
              className={`flex items-center space-x-2 py-3 px-3 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'submissions'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Submissions {submissions.length > 0 && `(${submissions.length})`}</span>
            </button>
          </div>

          <div className="p-6 text-slate-300 text-xs sm:text-sm space-y-6">
            {activeTab === 'description' ? (
              <>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-white mb-2">{problem.title}</h1>
                  <div className="flex flex-wrap items-center gap-2">
                    <YearBadge year={problem.academicYear} />
                    <DifficultyBadge difficulty={problem.difficulty} />
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
                      {problem.topic}
                    </span>
                    <span className="text-xs text-slate-500">Time Limit: {problem.timeLimit}s</span>
                  </div>
                </div>

                <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {problem.description}
                </div>

                {problem.inputFormat && (
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Input Format</h3>
                    <div className="p-3 rounded-xl bg-[#111622] border border-slate-800/80 text-slate-200 whitespace-pre-wrap">
                      {problem.inputFormat}
                    </div>
                  </div>
                )}

                {problem.outputFormat && (
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Output Format</h3>
                    <div className="p-3 rounded-xl bg-[#111622] border border-slate-800/80 text-slate-200 whitespace-pre-wrap">
                      {problem.outputFormat}
                    </div>
                  </div>
                )}

                {problem.constraints && (
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Constraints</h3>
                    <div className="p-3 rounded-xl bg-[#111622] border border-slate-800/80 font-mono text-xs text-amber-300/90 whitespace-pre-wrap">
                      {problem.constraints}
                    </div>
                  </div>
                )}

                {problem.sampleTestCases && problem.sampleTestCases.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Sample Test Cases</h3>
                    {problem.sampleTestCases.map((stc, idx) => (
                      <div
                        key={stc.id || idx}
                        className="rounded-xl bg-[#111622] border border-slate-800/80 p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                          <span>Sample Case {stc.displayOrder || idx + 1}</span>
                          <button
                            onClick={() => handleCopyInput(stc.inputData, idx)}
                            className="flex items-center space-x-1 text-[11px] text-slate-400 hover:text-white"
                          >
                            {copiedIdx === idx ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            <span>{copiedIdx === idx ? 'Copied' : 'Copy Input'}</span>
                          </button>
                        </div>

                        <div>
                          <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                            Sample Input:
                          </span>
                          <pre className="mt-1 p-2.5 rounded-lg bg-[#0b0e17] border border-slate-800/60 font-mono text-xs text-slate-200 overflow-x-auto">
                            {stc.inputData}
                          </pre>
                        </div>

                        <div>
                          <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                            Expected Output:
                          </span>
                          <pre className="mt-1 p-2.5 rounded-lg bg-[#0b0e17] border border-slate-800/60 font-mono text-xs text-emerald-400 overflow-x-auto">
                            {stc.expectedOutput}
                          </pre>
                        </div>

                        {stc.explanation && (
                          <div className="text-xs text-slate-400 pt-1 border-t border-slate-800/60">
                            <span className="font-semibold text-slate-300">Explanation: </span>
                            {stc.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white">Your Past Submissions</h3>
                {!isAuthenticated ? (
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
                    <p className="text-xs text-slate-400 mb-3">Sign in to track your personal submission history.</p>
                    <Link
                      to="/login"
                      className="inline-block px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white"
                    >
                      Log In
                    </Link>
                  </div>
                ) : submissions.length === 0 ? (
                  <p className="text-xs text-slate-500">No submissions made yet for this problem.</p>
                ) : (
                  <div className="space-y-3">
                    {submissions.map((sub) => (
                      <div
                        key={sub.id}
                        className="p-3.5 rounded-xl bg-[#111622] border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <StatusBadge status={sub.status} />
                            <span className="font-bold text-slate-300 uppercase">{sub.language}</span>
                          </div>
                          <div className="text-slate-500 text-[11px]">
                            {new Date(sub.submittedAt).toLocaleString()}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-bold text-blue-400">+{sub.pointsEarned} pts</div>
                          <div className="text-[11px] text-slate-400">
                            {sub.passedTestCases}/{sub.totalTestCases} tests passed
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Code Editor & Output (7 cols) */}
        <div className="lg:col-span-7 flex flex-col bg-[#0d111c] overflow-hidden max-h-[calc(100vh-112px)]">
          <div className="bg-[#101524] border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Language:</span>
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
                className="px-3 py-1 rounded-lg bg-[#0b0e17] border border-slate-700/80 text-white font-semibold text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="c">C (GCC)</option>
                <option value="cpp">C++ (G++)</option>
                <option value="java">Java (JDK)</option>
                <option value="python">Python 3</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleResetCode}
                title="Reset starter template"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={handleRunCode}
                disabled={running || submitting}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-50 transition-all shadow"
              >
                <Play className={`w-3.5 h-3.5 text-blue-400 ${running ? 'animate-spin' : ''}`} />
                <span>{running ? 'Running...' : 'Run Code'}</span>
              </button>

              <button
                onClick={handleSubmitCode}
                disabled={running || submitting}
                className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-600/30 disabled:opacity-50 transition-all"
              >
                <Send className={`w-3.5 h-3.5 ${submitting ? 'animate-bounce' : ''}`} />
                <span>{submitting ? 'Evaluating...' : 'Submit Solution'}</span>
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-[360px] relative bg-[#1e1e1e]">
            <Editor
              height="100%"
              language={language === 'c' || language === 'cpp' ? 'cpp' : language}
              value={sourceCode}
              onChange={(value) => setSourceCode(value || '')}
              theme="vs-dark"
              options={{
                fontSize: 14,
                fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                lineNumbers: 'on',
                bracketPairColorization: { enabled: true },
                formatOnPaste: true,
                padding: { top: 12, bottom: 12 },
              }}
            />
          </div>

          <div className="border-t border-slate-800 bg-[#0e121d] flex flex-col h-64 sm:h-72">
            <div className="flex items-center justify-between border-b border-slate-800/80 px-4 bg-[#0a0d14]">
              <div className="flex space-x-4">
                <button
                  onClick={() => setBottomTab('testcase')}
                  className={`py-2.5 text-xs font-bold border-b-2 transition-all ${
                    bottomTab === 'testcase'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Testcase
                </button>
                <button
                  onClick={() => setBottomTab('runResult')}
                  className={`py-2.5 text-xs font-bold border-b-2 transition-all ${
                    bottomTab === 'runResult'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Run Output {runResults && `(${runResults.filter((r) => r.passed).length}/${runResults.length} passed)`}
                </button>
                <button
                  onClick={() => setBottomTab('submitResult')}
                  className={`py-2.5 text-xs font-bold border-b-2 transition-all ${
                    bottomTab === 'submitResult'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Submission Result
                </button>
              </div>

              <label className="flex items-center space-x-2 text-xs text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useCustomInput}
                  onChange={(e) => {
                    setUseCustomInput(e.target.checked);
                    if (e.target.checked) setBottomTab('testcase');
                  }}
                  className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
                />
                <span>Custom Input</span>
              </label>
            </div>

            <div className="flex-1 p-4 overflow-y-auto text-xs font-mono">
              {bottomTab === 'testcase' && (
                <div>
                  {useCustomInput ? (
                    <div className="space-y-2">
                      <span className="text-slate-400 text-xs font-sans font-semibold">Enter Custom Standard Input:</span>
                      <textarea
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        placeholder="Provide stdin data to feed your program..."
                        rows={4}
                        className="w-full p-3 rounded-lg bg-[#080b12] border border-slate-800 font-mono text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex space-x-2">
                        {problem.sampleTestCases?.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedCaseIdx(idx)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              selectedCaseIdx === idx
                                ? 'bg-slate-800 text-white border border-slate-700'
                                : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800/60'
                            }`}
                          >
                            Case {idx + 1}
                          </button>
                        ))}
                      </div>

                      {problem.sampleTestCases && problem.sampleTestCases[selectedCaseIdx] && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <span className="text-slate-500 text-[11px] uppercase tracking-wider font-semibold font-sans">
                              Input
                            </span>
                            <pre className="mt-1 p-2 rounded-lg bg-[#080b12] border border-slate-800/80 text-slate-200">
                              {problem.sampleTestCases[selectedCaseIdx].inputData}
                            </pre>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[11px] uppercase tracking-wider font-semibold font-sans">
                              Expected Output
                            </span>
                            <pre className="mt-1 p-2 rounded-lg bg-[#080b12] border border-slate-800/80 text-emerald-400">
                              {problem.sampleTestCases[selectedCaseIdx].expectedOutput}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {bottomTab === 'runResult' && (
                <div>
                  {useCustomInput && customRunResult ? (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <StatusBadge status={customRunResult.status} />
                        <span className="text-slate-400 text-xs font-sans">
                          Execution time: {customRunResult.executionTime}s
                        </span>
                      </div>
                      {customRunResult.errorMessage ? (
                        <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-900/40 text-rose-300 whitespace-pre-wrap">
                          {customRunResult.errorMessage}
                        </div>
                      ) : (
                        <div>
                          <span className="text-slate-500 text-[11px] uppercase font-sans">Output:</span>
                          <pre className="mt-1 p-2.5 rounded-lg bg-[#080b12] border border-slate-800/80 text-emerald-400 whitespace-pre-wrap">
                            {customRunResult.actualOutput || '(no output)'}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : runResults ? (
                    <div className="space-y-3">
                      <div className="flex space-x-2">
                        {runResults.map((r, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedCaseIdx(idx)}
                            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold ${
                              selectedCaseIdx === idx
                                ? 'bg-slate-800 text-white border border-slate-700'
                                : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800/60'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${r.passed ? 'bg-emerald-400' : 'bg-rose-400'}`}
                            />
                            <span>Case {idx + 1}</span>
                          </button>
                        ))}
                      </div>

                      {runResults[selectedCaseIdx] && (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <StatusBadge status={runResults[selectedCaseIdx].status} />
                            <span className="text-slate-400 text-xs font-sans">
                              Time: {runResults[selectedCaseIdx].executionTime}s
                            </span>
                          </div>

                          {runResults[selectedCaseIdx].errorMessage ? (
                            <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-900/50 text-rose-300 whitespace-pre-wrap font-mono">
                              {runResults[selectedCaseIdx].errorMessage}
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <span className="text-slate-500 text-[11px] font-sans">Expected Output:</span>
                                <pre className="mt-1 p-2 rounded-lg bg-[#080b12] border border-slate-800 text-slate-300">
                                  {runResults[selectedCaseIdx].expectedOutput}
                                </pre>
                              </div>
                              <div>
                                <span className="text-slate-500 text-[11px] font-sans">Actual Output:</span>
                                <pre
                                  className={`mt-1 p-2 rounded-lg bg-[#080b12] border border-slate-800 ${
                                    runResults[selectedCaseIdx].passed ? 'text-emerald-400' : 'text-rose-400'
                                  }`}
                                >
                                  {runResults[selectedCaseIdx].actualOutput || '(no output)'}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500 font-sans">
                      Click <strong className="text-slate-300 font-semibold">Run Code</strong> to test your solution against sample cases.
                    </div>
                  )}
                </div>
              )}

              {bottomTab === 'submitResult' && (
                <div>
                  {submitResult ? (
                    <div className="space-y-4 font-sans">
                      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-[#111622] border border-slate-800">
                        <div className="flex items-center space-x-3">
                          <StatusBadge status={submitResult.status} />
                          <span className="text-sm font-bold text-white">
                            {submitResult.passedTestCases} / {submitResult.totalTestCases} Test Cases Passed
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-xs text-slate-400">Score:</span>
                          <span className="text-base font-extrabold text-blue-400">
                            +{submitResult.pointsEarned} / {submitResult.totalPoints} pts
                          </span>
                        </div>
                      </div>

                      {submitResult.errorMessage && (
                        <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-900/50 text-rose-300 text-xs font-mono whitespace-pre-wrap">
                          {submitResult.errorMessage}
                        </div>
                      )}

                      <div>
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-2">
                          Evaluation Details
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                          {submitResult.cases.map((c) => (
                            <div
                              key={c.testCaseIndex}
                              className={`p-2.5 rounded-lg border text-center ${
                                c.passed
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                              }`}
                            >
                              <div className="text-xs font-bold">Case {c.testCaseIndex}</div>
                              <div className="text-[11px] mt-0.5">{c.passed ? '✓ Passed' : '✗ Failed'}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500 font-sans">
                      Click <strong className="text-slate-300 font-semibold">Submit Solution</strong> to evaluate your code against hidden test cases.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Guest Authentication Modal */}
      {guestModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111622] border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-white">Sign In to Submit Solutions</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Guest mode allows running against sample test cases. To evaluate your solution against hidden test cases, earn
                points, and track your ranking, please sign in or create an account.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Link
                to="/login"
                className="py-2.5 px-4 rounded-xl text-center text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="py-2.5 px-4 rounded-xl text-center text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/30"
              >
                Register
              </Link>
            </div>
            <button
              onClick={() => setGuestModalOpen(false)}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-400 pt-1"
            >
              Continue browsing as Guest
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
