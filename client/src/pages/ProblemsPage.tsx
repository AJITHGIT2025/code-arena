import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { Problem } from '../types';
import { DifficultyBadge, YearBadge } from '../components/Badge';
import { Search, Filter, CheckCircle2, Circle, ArrowRight, BookOpen } from 'lucide-react';

export const ProblemsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const selectedYear = searchParams.get('year') || 'All';

  useEffect(() => {
    fetchProblems();
  }, [selectedYear, selectedDifficulty]);

  const fetchProblems = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedYear !== 'All') params.year = selectedYear;
      if (selectedDifficulty !== 'All') params.difficulty = selectedDifficulty;

      const res = await api.get('/problems', { params });
      setProblems(res.data.problems || []);
    } catch (err) {
      console.error('Failed to load problems:', err);
    } finally {
      setLoading(false);
    }
  };

  const setYearFilter = (year: string) => {
    if (year === 'All') {
      searchParams.delete('year');
    } else {
      searchParams.set('year', year);
    }
    setSearchParams(searchParams);
  };

  const filteredProblems = problems.filter((prob) => {
    const matchesSearch =
      prob.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prob.problemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prob.topic.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedStatus === 'Solved') return prob.solved;
    if (selectedStatus === 'Unsolved') return !prob.solved;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-400 mb-2">
            <BookOpen className="w-4 h-4" />
            <span>Problem Explorer</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Practice Problem Bank</h1>
          <p className="text-sm text-slate-400 mt-1">
            Browse and solve coding questions curated for engineering students across academic years.
          </p>
        </div>

        {/* Academic Year Switcher Tabs */}
        <div className="flex border-b border-slate-800 space-x-2 sm:space-x-8 mb-8 overflow-x-auto pb-1">
          {['All', '1st Year', '2nd Year', '3rd Year'].map((year) => (
            <button
              key={year}
              onClick={() => setYearFilter(year)}
              className={`pb-3 text-sm font-bold whitespace-nowrap transition-all border-b-2 -mb-[2px] ${
                selectedYear === year
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {year === 'All' ? 'All Academic Years' : year}
            </button>
          ))}
        </div>

        {/* Search & Filters Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, topic, or code (e.g. SUM-001)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#111622] border border-slate-800 text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-[#111622] border border-slate-800 text-slate-300 text-xs sm:text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="All">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-[#111622] border border-slate-800 text-slate-300 text-xs sm:text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Solved">Solved</option>
            <option value="Unsolved">Unsolved</option>
          </select>
        </div>

        {/* Problems List / Table */}
        <div className="bg-[#111622] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="py-20 text-center text-slate-500 text-sm">Loading problems...</div>
          ) : filteredProblems.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto mb-3 text-slate-500">
                <Filter className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-white">No problems found</h3>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your year, difficulty, or search query.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-900/80 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold">
                    <th className="py-3.5 px-4 w-12 text-center">Status</th>
                    <th className="py-3.5 px-4 w-28">Code</th>
                    <th className="py-3.5 px-4">Title</th>
                    <th className="py-3.5 px-4">Academic Year</th>
                    <th className="py-3.5 px-4">Topic</th>
                    <th className="py-3.5 px-4">Difficulty</th>
                    <th className="py-3.5 px-4 text-right">Points</th>
                    <th className="py-3.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredProblems.map((prob) => (
                    <tr
                      key={prob.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      <td className="py-4 px-4 text-center">
                        {prob.solved ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-600 mx-auto" />
                        )}
                      </td>

                      <td className="py-4 px-4 font-mono font-bold text-slate-300">
                        {prob.problemCode}
                      </td>

                      <td className="py-4 px-4">
                        <Link
                          to={`/problems/${prob.problemCode}`}
                          className="font-bold text-white hover:text-blue-400 transition-colors line-clamp-1"
                        >
                          {prob.title}
                        </Link>
                      </td>

                      <td className="py-4 px-4">
                        <YearBadge year={prob.academicYear} />
                      </td>

                      <td className="py-4 px-4 text-slate-400">
                        {prob.topic}
                      </td>

                      <td className="py-4 px-4">
                        <DifficultyBadge difficulty={prob.difficulty} />
                      </td>

                      <td className="py-4 px-4 text-right font-semibold text-blue-400">
                        {prob.points} pts
                      </td>

                      <td className="py-4 px-4 text-center">
                        <Link
                          to={`/problems/${prob.problemCode}`}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white transition-colors"
                        >
                          <span>Solve</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
