import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { DifficultyBadge, YearBadge, StatusBadge } from '../components/Badge';
import {
  CheckCircle2,
  Trophy,
  Target,
  Award,
  Layers,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardStats();
    }
  }, [isAuthenticated]);

  const fetchDashboardStats = async () => {
    try {
      const res = await api.get('/stats/dashboard');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center text-slate-500">Checking authentication...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 bg-[#111622] border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center text-xl font-black text-white shadow-lg shadow-blue-500/20 uppercase">
              {user?.name?.charAt(0) || 'S'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-black text-white">{user?.name}</h1>
                <YearBadge year={user?.academicYear || '1st Year'} />
              </div>
              <p className="text-xs text-slate-400 mt-1">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center space-x-6 bg-[#0c101a] px-5 py-3 rounded-xl border border-slate-800/80">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Total Score
              </span>
              <span className="text-xl font-black text-blue-400">{stats?.totalPoints || 0} pts</span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Solved
              </span>
              <span className="text-xl font-black text-emerald-400">
                {stats?.solvedCount || 0} / {stats?.totalProblems || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-5 rounded-2xl bg-[#111622] border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400">Problems Solved</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white">{stats?.solvedCount || 0}</div>
            <p className="text-[11px] text-slate-500 mt-1">
              out of {stats?.totalProblems || 0} available problems
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#111622] border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400">Attempted</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                <Target className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white">{stats?.attemptedCount || 0}</div>
            <p className="text-[11px] text-slate-500 mt-1">problems tackled so far</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#111622] border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400">Total Points</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <Trophy className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-400">{stats?.totalPoints || 0}</div>
            <p className="text-[11px] text-slate-500 mt-1">earned across all solved problems</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#111622] border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400">Completion Rate</span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-purple-400">
              {stats?.totalProblems > 0
                ? Math.round((stats.solvedCount / stats.totalProblems) * 100)
                : 0}
              %
            </div>
            <p className="text-[11px] text-slate-500 mt-1">of entire question bank</p>
          </div>
        </div>

        {/* Year-Wise Progress */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
            <Layers className="w-5 h-5 text-blue-400" />
            <span>Academic Year Progress</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {['1st Year', '2nd Year', '3rd Year'].map((yr) => {
              const data = stats?.yearStats?.[yr] || { total: 0, solved: 0 };
              const percent = data.total > 0 ? Math.round((data.solved / data.total) * 100) : 0;
              return (
                <div key={yr} className="p-5 rounded-2xl bg-[#111622] border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <YearBadge year={yr} />
                    <span className="text-xs font-bold text-white">
                      {data.solved} / {data.total} Solved
                    </span>
                  </div>

                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{percent}% Completed</span>
                    <Link to={`/problems?year=${encodeURIComponent(yr)}`} className="text-blue-400 hover:underline">
                      Practice Track →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Difficulty & Recent Submissions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[#111622] border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white">Difficulty Distribution</h3>
            {['Easy', 'Medium', 'Hard'].map((diff) => {
              const diffData = stats?.difficultyStats?.[diff] || { total: 0, solved: 0 };
              const diffPct = diffData.total > 0 ? Math.round((diffData.solved / diffData.total) * 100) : 0;
              return (
                <div key={diff} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <DifficultyBadge difficulty={diff} />
                    <span className="font-semibold text-slate-300">
                      {diffData.solved} / {diffData.total} ({diffPct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        diff === 'Easy'
                          ? 'bg-emerald-400'
                          : diff === 'Medium'
                          ? 'bg-amber-400'
                          : 'bg-rose-400'
                      }`}
                      style={{ width: `${diffPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-2 p-6 rounded-2xl bg-[#111622] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Recent Submissions</h3>
              <Link to="/problems" className="text-xs text-blue-400 hover:underline">
                Find new problems →
              </Link>
            </div>

            {loading ? (
              <p className="text-xs text-slate-500">Loading activity...</p>
            ) : !stats?.recentSubmissions || stats.recentSubmissions.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No submissions recorded yet.</p>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {stats.recentSubmissions.map((sub: any) => (
                  <div key={sub.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <StatusBadge status={sub.status} />
                        <Link
                          to={`/problems/${sub.problem.problemCode}`}
                          className="font-bold text-white hover:text-blue-400"
                        >
                          {sub.problem.title}
                        </Link>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {sub.problem.problemCode} • {sub.language.toUpperCase()} • {new Date(sub.submittedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-blue-400">+{sub.pointsEarned} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
