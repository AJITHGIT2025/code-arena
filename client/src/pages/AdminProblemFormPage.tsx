import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { SampleTestCase, HiddenTestCase } from '../types';
import {
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  Code2,
  FileText,
  Shield,
} from 'lucide-react';

export const AdminProblemFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [problemCode, setProblemCode] = useState('');
  const [title, setTitle] = useState('');
  const [academicYear, setAcademicYear] = useState('1st Year');
  const [topic, setTopic] = useState('Arrays');
  const [difficulty, setDifficulty] = useState('Easy');
  const [points, setPoints] = useState(100);
  const [description, setDescription] = useState('');
  const [inputFormat, setInputFormat] = useState('');
  const [outputFormat, setOutputFormat] = useState('');
  const [constraints, setConstraints] = useState('');
  const [timeLimit, setTimeLimit] = useState(2.0);
  const [memoryLimit, setMemoryLimit] = useState(256);
  const [isPublished, setIsPublished] = useState(true);

  // Starter Codes
  const [starterCodeC, setStarterCodeC] = useState('');
  const [starterCodeCpp, setStarterCodeCpp] = useState('');
  const [starterCodeJava, setStarterCodeJava] = useState('');
  const [starterCodePython, setStarterCodePython] = useState('');

  // Test Cases
  const [sampleCases, setSampleCases] = useState<SampleTestCase[]>([
    { inputData: '', expectedOutput: '', explanation: '', displayOrder: 1 },
  ]);
  const [hiddenCases, setHiddenCases] = useState<HiddenTestCase[]>([
    { inputData: '', expectedOutput: '', pointsOrWeight: 25 },
  ]);

  useEffect(() => {
    if (isEditMode && id) {
      fetchProblemForEdit(id);
    }
  }, [id]);

  const fetchProblemForEdit = async (probId: string) => {
    try {
      const res = await api.get(`/problems/admin/detail/${probId}`);
      const p = res.data.problem;
      setProblemCode(p.problemCode || '');
      setTitle(p.title || '');
      setAcademicYear(p.academicYear || '1st Year');
      setTopic(p.topic || 'Arrays');
      setDifficulty(p.difficulty || 'Easy');
      setPoints(p.points || 100);
      setDescription(p.description || '');
      setInputFormat(p.inputFormat || '');
      setOutputFormat(p.outputFormat || '');
      setConstraints(p.constraints || '');
      setTimeLimit(p.timeLimit || 2.0);
      setMemoryLimit(p.memoryLimit || 256);
      setIsPublished(p.isPublished !== undefined ? p.isPublished : true);

      setStarterCodeC(p.starterCodeC || '');
      setStarterCodeCpp(p.starterCodeCpp || '');
      setStarterCodeJava(p.starterCodeJava || '');
      setStarterCodePython(p.starterCodePython || '');

      if (p.sampleTestCases && p.sampleTestCases.length > 0) {
        setSampleCases(p.sampleTestCases);
      }
      if (p.hiddenTestCases && p.hiddenTestCases.length > 0) {
        setHiddenCases(p.hiddenTestCases);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load problem for editing.');
    } finally {
      setLoading(false);
    }
  };

  const addSampleCase = () => {
    setSampleCases([
      ...sampleCases,
      { inputData: '', expectedOutput: '', explanation: '', displayOrder: sampleCases.length + 1 },
    ]);
  };

  const updateSampleCase = (index: number, field: keyof SampleTestCase, value: any) => {
    const updated = [...sampleCases];
    updated[index] = { ...updated[index], [field]: value };
    setSampleCases(updated);
  };

  const removeSampleCase = (index: number) => {
    if (sampleCases.length <= 1) return;
    setSampleCases(sampleCases.filter((_, i) => i !== index));
  };

  const addHiddenCase = () => {
    setHiddenCases([...hiddenCases, { inputData: '', expectedOutput: '', pointsOrWeight: 25 }]);
  };

  const updateHiddenCase = (index: number, field: keyof HiddenTestCase, value: any) => {
    const updated = [...hiddenCases];
    updated[index] = { ...updated[index], [field]: value };
    setHiddenCases(updated);
  };

  const removeHiddenCase = (index: number) => {
    if (hiddenCases.length <= 1) return;
    setHiddenCases(hiddenCases.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const payload = {
      problemCode: problemCode.trim(),
      title: title.trim(),
      academicYear,
      topic: topic.trim(),
      difficulty,
      points: Number(points),
      description,
      inputFormat,
      outputFormat,
      constraints,
      timeLimit: Number(timeLimit),
      memoryLimit: Number(memoryLimit),
      isPublished,
      starterCodeC: starterCodeC || null,
      starterCodeCpp: starterCodeCpp || null,
      starterCodeJava: starterCodeJava || null,
      starterCodePython: starterCodePython || null,
      sampleTestCases: sampleCases,
      hiddenTestCases: hiddenCases,
    };

    try {
      if (isEditMode && id) {
        await api.put(`/problems/${id}`, payload);
      } else {
        await api.post('/problems', payload);
      }
      navigate('/admin');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save problem.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center text-slate-500">Loading problem details...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Link
              to="/admin"
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-white">
                {isEditMode ? 'Edit Problem' : 'Create New Problem'}
              </h1>
              <p className="text-xs text-slate-400">
                Define the question statement, constraints, sample inputs, and hidden test cases for automatic evaluation.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 mb-6 rounded-xl bg-rose-950/40 border border-rose-900/60 text-xs text-rose-300 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* SECTION 1: CORE METADATA */}
          <div className="bg-[#111622] border border-slate-800 rounded-2xl p-6 space-y-5">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <span>Problem Metadata & Classification</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Problem Code / ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. SUM-001 or leave blank to auto-generate"
                  value={problemCode}
                  onChange={(e) => setProblemCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0d14] border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Problem Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sum of Two Numbers"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0d14] border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Academic Year *
                </label>
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0d14] border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="1st Year">1st Year (Fundamentals)</option>
                  <option value="2nd Year">2nd Year (Data Structures)</option>
                  <option value="3rd Year">3rd Year (Advanced Algorithms)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Topic / Category *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Arrays, Strings, Trees, DP"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0d14] border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Difficulty *
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0d14] border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Points *
                </label>
                <input
                  type="number"
                  required
                  min={10}
                  max={500}
                  value={points}
                  onChange={(e) => setPoints(parseInt(e.target.value, 10))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0d14] border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800/80">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Time Limit (Seconds)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="10"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(parseFloat(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0d14] border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Memory Limit (MB)
                </label>
                <input
                  type="number"
                  min="64"
                  max="1024"
                  value={memoryLimit}
                  onChange={(e) => setMemoryLimit(parseInt(e.target.value, 10))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0d14] border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center pt-6">
                <label className="flex items-center space-x-2 text-xs font-bold text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="w-4 h-4 rounded bg-[#0a0d14] border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
                  />
                  <span>Publish to Students Immediately</span>
                </label>
              </div>
            </div>
          </div>

          {/* SECTION 2: PROBLEM STATEMENT */}
          <div className="bg-[#111622] border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Code2 className="w-4 h-4 text-purple-400" />
              <span>Problem Statement & Specification</span>
            </h2>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Problem Description *
              </label>
              <textarea
                required
                rows={5}
                placeholder="Detailed description of the task, logic, and context..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#0a0d14] border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Input Format
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. First line contains N. Second line contains N integers."
                  value={inputFormat}
                  onChange={(e) => setInputFormat(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#0a0d14] border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Output Format
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Print a single integer representing the sum."
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#0a0d14] border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Constraints
              </label>
              <textarea
                rows={2}
                placeholder="e.g. 1 <= N <= 10^5, -10^9 <= A[i] <= 10^9"
                value={constraints}
                onChange={(e) => setConstraints(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#0a0d14] border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          {/* SECTION 3: SAMPLE TEST CASES */}
          <div className="bg-[#111622] border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Sample Test Cases (Visible to Students)</h2>
                <p className="text-xs text-slate-400">Used for problem description and local 'Run Code' checks.</p>
              </div>
              <button
                type="button"
                onClick={addSampleCase}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white transition-colors flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Sample Case</span>
              </button>
            </div>

            <div className="space-y-4">
              {sampleCases.map((tc, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-[#0a0d14] border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-400">Sample Case #{idx + 1}</span>
                    {sampleCases.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSampleCase(idx)}
                        className="text-xs text-rose-400 hover:text-rose-300 flex items-center space-x-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                        Input Data (stdin)
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={tc.inputData}
                        onChange={(e) => updateSampleCase(idx, 'inputData', e.target.value)}
                        placeholder="5 7"
                        className="w-full p-2.5 rounded-lg bg-[#111622] border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                        Expected Output (stdout)
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={tc.expectedOutput}
                        onChange={(e) => updateSampleCase(idx, 'expectedOutput', e.target.value)}
                        placeholder="12"
                        className="w-full p-2.5 rounded-lg bg-[#111622] border border-slate-800 text-xs font-mono text-emerald-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Explanation (Optional)
                    </label>
                    <input
                      type="text"
                      value={tc.explanation || ''}
                      onChange={(e) => updateSampleCase(idx, 'explanation', e.target.value)}
                      placeholder="e.g. 5 + 7 = 12"
                      className="w-full px-3 py-1.5 rounded-lg bg-[#111622] border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 4: HIDDEN TEST CASES */}
          <div className="bg-[#111622] border border-purple-500/30 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-purple-300 flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-purple-400" />
                  <span>Hidden Test Cases (Server-Side Evaluation Only)</span>
                </h2>
                <p className="text-xs text-slate-400">
                  These test cases are NEVER exposed to the student browser. Used to calculate final points and status.
                </p>
              </div>
              <button
                type="button"
                onClick={addHiddenCase}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600/20 text-purple-300 hover:bg-purple-600 hover:text-white transition-colors flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Hidden Case</span>
              </button>
            </div>

            <div className="space-y-4">
              {hiddenCases.map((htc, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-[#0a0d14] border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-400">Hidden Edge Case #{idx + 1}</span>
                    {hiddenCases.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeHiddenCase(idx)}
                        className="text-xs text-rose-400 hover:text-rose-300 flex items-center space-x-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                        Hidden Input Data
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={htc.inputData}
                        onChange={(e) => updateHiddenCase(idx, 'inputData', e.target.value)}
                        placeholder="1000 2000"
                        className="w-full p-2.5 rounded-lg bg-[#111622] border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                        Expected Output
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={htc.expectedOutput}
                        onChange={(e) => updateHiddenCase(idx, 'expectedOutput', e.target.value)}
                        placeholder="3000"
                        className="w-full p-2.5 rounded-lg bg-[#111622] border border-slate-800 text-xs font-mono text-emerald-400 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 5: STARTER CODE */}
          <div className="bg-[#111622] border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-white">Starter Code Templates (Optional)</h2>
            <p className="text-xs text-slate-400">
              Provide starter code templates for students. If left blank, default standard templates will be used.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">C Starter Code</label>
                <textarea
                  rows={4}
                  value={starterCodeC}
                  onChange={(e) => setStarterCodeC(e.target.value)}
                  placeholder="#include <stdio.h>..."
                  className="w-full p-2.5 rounded-lg bg-[#0a0d14] border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">C++ Starter Code</label>
                <textarea
                  rows={4}
                  value={starterCodeCpp}
                  onChange={(e) => setStarterCodeCpp(e.target.value)}
                  placeholder="#include <iostream>..."
                  className="w-full p-2.5 rounded-lg bg-[#0a0d14] border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Java Starter Code</label>
                <textarea
                  rows={4}
                  value={starterCodeJava}
                  onChange={(e) => setStarterCodeJava(e.target.value)}
                  placeholder="public class Main {..."
                  className="w-full p-2.5 rounded-lg bg-[#0a0d14] border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Python Starter Code</label>
                <textarea
                  rows={4}
                  value={starterCodePython}
                  onChange={(e) => setStarterCodePython(e.target.value)}
                  placeholder="import sys..."
                  className="w-full p-2.5 rounded-lg bg-[#0a0d14] border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4">
            <Link
              to="/admin"
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-600/30 flex items-center space-x-2 disabled:opacity-50 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Saving Problem...' : isEditMode ? 'Update Problem' : 'Save & Publish Problem'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
