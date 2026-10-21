import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Problem, Submission } from '../types';
import { DifficultyBadge, YearBadge, StatusBadge } from '../components/Badge';
import {
  Shield,
  Plus,
  Download,
  Upload,
  Trash2,
  Edit,
  Eye,
  Search,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { isAdmin, isAuthenticated, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<'problems' | 'submissions' | 'overview'>('problems');
  const [stats, setStats] = useState<any | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [yearFilter, setYearFilter] = useState('All');

  // Import Modal
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, problemsRes, submissionsRes] = await Promise.all([
        api.get('/stats/admin'),
        api.get('/problems?limit=100'),
        api.get('/submissions/admin/all?limit=50'),
      ]);
      setStats(statsRes.data);
      setProblems(problemsRes.data.problems || []);
      setAllSubmissions(submissionsRes.data.submissions || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProblem = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete problem "${title}"? This cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/problems/${id}`);
      setProblems(problems.filter((p) => p.id !== id));
      alert(`Problem "${title}" deleted.`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete problem.');
    }
  };

  const handleTogglePublish = async (id: string) => {
    try {
      const res = await api.patch(`/problems/${id}/publish`);
      setProblems(
        problems.map((p) => (p.id === id ? { ...p, isPublished: res.data.isPublished } : p))
      );
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to toggle publication status.');
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.get('/problems/admin/export');
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `code_arena_questions_${Date.now()}.json`;
      a.click();
    } catch (err) {
      alert('Failed to export questions.');
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setImporting(true);
    try {
      const parsed = JSON.parse(importJson);
      const res = await api.post('/problems/admin/import', parsed);
      alert(res.data.message || 'Import successful!');
      setImportModalOpen(false);
      setImportJson('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Invalid JSON format or import error.');
    } finally {
      setImporting(false);
    }
  };

  if (authLoading) {
    return <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center text-slate-500">Authenticating...</div>;
  }

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  const filteredProblems = problems.filter((prob) => {
    const matchesSearch =
      prob.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prob.problemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prob.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesYear = yearFilter === 'All' || prob.academicYear === yearFilter;
    return matchesSearch && matchesYear;
  });

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 bg-[#111622] border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-black text-white">Administrator Portal</h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Full Control
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage all questions, hidden test cases, student submissions, and platform settings.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExport}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center space-x-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Questions</span>
            </button>

            <button
              onClick={() => setImportModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center space-x-1.5 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import JSON</span>
            </button>

            <Link
              to="/admin/problems/create"
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-600/30 flex items-center space-x-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Problem</span>
            </Link>
          </div>
        </div>

        <div className="flex border-b border-slate-800 space-x-8 mb-8">
          <button
            onClick={() => setActiveTab('problems')}
            className={`pb-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'problems'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Question Management ({problems.length})
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Platform Overview
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`pb-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'submissions'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Student Submissions Stream
          </button>
        </div>

        {activeTab === 'problems' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative md:col-span-2">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search questions by title, code, or topic..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#111622] border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-[#111622] border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="All">All Academic Years</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
              </select>
            </div>

            <div className="bg-[#111622] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              {loading ? (
                <div className="py-16 text-center text-xs text-slate-500">Loading questions...</div>
              ) : filteredProblems.length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-xs">No questions found matching criteria.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold">
                        <th className="py-3 px-4">Code</th>
                        <th className="py-3 px-4">Title</th>
                        <th className="py-3 px-4">Year</th>
                        <th className="py-3 px-4">Difficulty</th>
                        <th className="py-3 px-4 text-center">Hidden Cases</th>
                        <th className="py-3 px-4 text-right">Points</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredProblems.map((prob) => (
                        <tr key={prob.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-300">{prob.problemCode}</td>
                          <td className="py-3.5 px-4 font-bold text-white max-w-xs truncate">{prob.title}</td>
                          <td className="py-3.5 px-4">
                            <YearBadge year={prob.academicYear} />
                          </td>
                          <td className="py-3.5 px-4">
                            <DifficultyBadge difficulty={prob.difficulty} />
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                              {prob.hiddenTestCases?.length ?? (prob as any).hiddenCaseCount ?? '✓'} cases
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-blue-400">{prob.points} pts</td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => handleTogglePublish(prob.id)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                                prob.isPublished
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                              }`}
                            >
                              {prob.isPublished ? 'Published' : 'Draft'}
                            </button>
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            <Link
                              to={`/problems/${prob.problemCode}`}
                              title="Preview student view"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 inline-block transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Link>

                            <Link
                              to={`/admin/problems/edit/${prob.id}`}
                              title="Edit problem and test cases"
                              className="p-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white inline-block transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Link>

                            <button
                              onClick={() => handleDeleteProblem(prob.id, prob.title)}
                              title="Delete problem"
                              className="p-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white inline-block transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-[#111622] border border-slate-800">
                <span className="text-xs text-slate-400 font-semibold block mb-1">Registered Students</span>
                <span className="text-2xl font-black text-white">{stats?.totalStudents || 0}</span>
              </div>
              <div className="p-5 rounded-2xl bg-[#111622] border border-slate-800">
                <span className="text-xs text-slate-400 font-semibold block mb-1">Total Problems</span>
                <span className="text-2xl font-black text-blue-400">{stats?.totalProblems || 0}</span>
              </div>
              <div className="p-5 rounded-2xl bg-[#111622] border border-slate-800">
                <span className="text-xs text-slate-400 font-semibold block mb-1">Submissions Evaluated</span>
                <span className="text-2xl font-black text-purple-400">{stats?.totalSubmissions || 0}</span>
              </div>
              <div className="p-5 rounded-2xl bg-[#111622] border border-slate-800">
                <span className="text-xs text-slate-400 font-semibold block mb-1">Overall Pass Rate</span>
                <span className="text-2xl font-black text-emerald-400">{stats?.passRate || 0}%</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#111622] border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white">Language Popularity</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {stats?.languageDistribution?.map((item: any) => (
                  <div key={item.language} className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-xs font-mono uppercase text-slate-400 font-bold block mb-1">
                      {item.language}
                    </span>
                    <span className="text-lg font-black text-white">{item.count} submissions</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'submissions' && (
          <div className="bg-[#111622] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {allSubmissions.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-500">No submissions recorded yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold">
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Year</th>
                      <th className="py-3 px-4">Problem</th>
                      <th className="py-3 px-4">Language</th>
                      <th className="py-3 px-4">Result</th>
                      <th className="py-3 px-4 text-center">Cases Passed</th>
                      <th className="py-3 px-4 text-right">Points</th>
                      <th className="py-3 px-4 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {allSubmissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white">{sub.user?.name || 'Unknown'}</td>
                        <td className="py-3.5 px-4">
                          <YearBadge year={sub.user?.academicYear || '1st Year'} />
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-300">{sub.problem?.title}</td>
                        <td className="py-3.5 px-4 font-mono font-bold uppercase text-slate-400">{sub.language}</td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={sub.status} />
                        </td>
                        <td className="py-3.5 px-4 text-center text-slate-300">
                          {sub.passedTestCases} / {sub.totalTestCases}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-blue-400">+{sub.pointsEarned} pts</td>
                        <td className="py-3.5 px-4 text-right text-slate-500 font-mono text-[11px]">
                          {new Date(sub.submittedAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {importModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111622] border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Import Questions JSON</h3>
            <p className="text-xs text-slate-400">
              Paste an array of problem objects containing title, description, academicYear, sampleTestCases, and
              hiddenTestCases.
            </p>
            <form onSubmit={handleImportSubmit} className="space-y-4">
              <textarea
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder="[ { title: '...', description: '...', academicYear: '1st Year', sampleTestCases: [...], hiddenTestCases: [...] } ]"
                rows={10}
                required
                className="w-full p-3 rounded-xl bg-[#0a0d14] border border-slate-800 font-mono text-xs text-white focus:outline-none focus:border-blue-500"
              />
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setImportModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importing}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50"
                >
                  {importing ? 'Importing...' : 'Submit Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
