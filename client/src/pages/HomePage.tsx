import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Problem } from '../types';
import { DifficultyBadge, YearBadge } from '../components/Badge';
import {
  Terminal,
  Trophy,
  ArrowRight,
  Sparkles,
  Play,
  ShieldCheck,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const [featuredProblems, setFeaturedProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await api.get('/problems?limit=6');
        setFeaturedProblems(res.data.problems || []);
      } catch (err) {
        console.error('Failed to load featured problems:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const yearTracks = [
    {
      year: '1st Year',
      title: 'Programming Fundamentals',
      subtitle: 'Building a Rock-Solid Foundation',
      description:
        'Master variables, data types, conditionals, loops, arrays, strings, and modular functions. Build confidence with foundational syntax and logical problem solving.',
      topics: ['Variables & Types', 'Conditionals', 'Loops', '1D/2D Arrays', 'Strings', 'Functions'],
      color: 'from-blue-600/20 via-blue-500/10 to-transparent',
      borderColor: 'border-blue-500/30 hover:border-blue-500/60',
      tagColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      badgeText: 'Beginner Level',
      link: '/problems?year=1st+Year',
    },
    {
      year: '2nd Year',
      title: 'Data Structures & Algorithms',
      subtitle: 'Data Organization & Problem Modeling',
      description:
        'Dive into recursion, sorting, searching, linked lists, stacks, queues, binary trees, hashing, and object-oriented patterns. Learn efficient data management.',
      topics: ['Recursion', 'Sorting & Searching', 'Linked Lists', 'Stacks & Queues', 'Trees', 'OOP'],
      color: 'from-purple-600/20 via-purple-500/10 to-transparent',
      borderColor: 'border-purple-500/30 hover:border-purple-500/60',
      tagColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      badgeText: 'Intermediate Level',
      link: '/problems?year=2nd+Year',
    },
    {
      year: '3rd Year',
      title: 'Advanced Algorithms & Optimization',
      subtitle: 'Competitive Programming & Mastery',
      description:
        'Conquer dynamic programming, greedy strategies, backtracking, graph traversals (BFS/DFS, Dijkstra), algorithm optimization, and competitive interview challenges.',
      topics: ['Dynamic Programming', 'Greedy Algorithms', 'Backtracking', 'Graphs', 'Advanced DS', 'Optimization'],
      color: 'from-indigo-600/20 via-indigo-500/10 to-transparent',
      borderColor: 'border-indigo-500/30 hover:border-indigo-500/60',
      tagColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      badgeText: 'Advanced Level',
      link: '/problems?year=3rd+Year',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b border-slate-800/60">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-blue-600/15 via-purple-600/15 to-cyan-500/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/60 text-xs font-semibold text-slate-300 shadow-inner mb-6">
            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-ping mr-1" />
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Interactive College Online Judge & Question Bank</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white mb-6">
            Practice. Code.{' '}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 text-transparent bg-clip-text">
              Compete.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-400 mb-10 leading-relaxed">
            Your journey from programming fundamentals to advanced problem solving starts here. Practice curated questions
            organized by academic year, run solutions in C, C++, Java, and Python, and earn points on the college leaderboard.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/problems"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 shadow-xl shadow-blue-600/25 hover:shadow-blue-600/40 transition-all flex items-center justify-center space-x-2 group"
            >
              <span>Start Practicing</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/leaderboard"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold text-slate-300 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 hover:text-white transition-all flex items-center justify-center space-x-2"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>View Leaderboard</span>
            </Link>
          </div>

          {/* Key Value Props Bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 text-left">
              <div className="text-2xl font-black text-white">4 Runtimes</div>
              <div className="text-xs text-slate-400 mt-1">C, C++, Java, & Python</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 text-left">
              <div className="text-2xl font-black text-blue-400">3 Years</div>
              <div className="text-xs text-slate-400 mt-1">1st, 2nd, & 3rd Year Tracks</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 text-left">
              <div className="text-2xl font-black text-purple-400">100% Real</div>
              <div className="text-xs text-slate-400 mt-1">Automated Hidden Evaluation</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 text-left">
              <div className="text-2xl font-black text-emerald-400">Monaco</div>
              <div className="text-xs text-slate-400 mt-1">Professional Pro Code Editor</div>
            </div>
          </div>
        </div>
      </section>

      {/* Academic Year Tracks Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Organized by Academic Year
          </h2>
          <p className="mt-3 text-slate-400 text-sm sm:text-base">
            Select your year to practice topics matching your college curriculum, from elementary coding to competitive interview mastery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {yearTracks.map((track) => (
            <div
              key={track.year}
              className={`relative rounded-2xl bg-[#111622] border ${track.borderColor} p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-900/10 group`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${track.tagColor}`}>
                    {track.badgeText}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">{track.year}</span>
                </div>

                <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors mb-2">
                  {track.title}
                </h3>
                <p className="text-xs font-medium text-slate-400 mb-3">{track.subtitle}</p>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">{track.description}</p>

                <div className="space-y-2 mb-6">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Core Topics</span>
                  <div className="flex flex-wrap gap-1.5">
                    {track.topics.map((t) => (
                      <span
                        key={t}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/50"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <Link
                to={track.link}
                className="w-full mt-4 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
              >
                <span>Browse {track.year} Problems</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Problems Section */}
      <section className="py-16 bg-[#080b12] border-y border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Featured Problems</h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">Jump right in and solve a coding challenge right now.</p>
            </div>
            <Link
              to="/problems"
              className="mt-4 sm:mt-0 inline-flex items-center space-x-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
            >
              <span>Explore all problems</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500 text-sm">Loading practice problems...</div>
          ) : featuredProblems.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">No problems published yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {featuredProblems.map((prob) => (
                <Link
                  key={prob.id}
                  to={`/problems/${prob.problemCode}`}
                  className="rounded-xl bg-[#111622] border border-slate-800 hover:border-blue-500/50 p-5 transition-all hover:-translate-y-0.5 group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono font-bold text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded">
                        {prob.problemCode}
                      </span>
                      <YearBadge year={prob.academicYear} />
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors mb-2 line-clamp-1">
                      {prob.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                      {prob.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/70 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <DifficultyBadge difficulty={prob.difficulty} />
                      <span className="text-slate-500">{prob.topic}</span>
                    </div>
                    <span className="font-semibold text-blue-400">{prob.points} pts</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Real Online Judge Workflow Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Genuine Automated Judge Engine
          </h2>
          <p className="mt-3 text-slate-400 text-sm sm:text-base">
            No simulated results or fake scores. Your code is compiled and executed in an isolated sandbox with standard input and output.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-[#111622] border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center mb-4">
              <Terminal className="w-5 h-5 text-blue-400" />
            </div>
            <h4 className="text-base font-bold text-white mb-2">1. Choose Language</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Write your solution in C, C++, Java, or Python with built-in starter templates and Monaco syntax highlighting.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#111622] border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center mb-4">
              <Play className="w-5 h-5 text-indigo-400" />
            </div>
            <h4 className="text-base font-bold text-white mb-2">2. Test & Run</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Run your code against public sample test cases or custom input to check correctness and debug logic.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#111622] border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
            </div>
            <h4 className="text-base font-bold text-white mb-2">3. Hidden Test Cases</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Submit your program to be judged against private hidden edge cases without revealing private test data.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#111622] border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-4">
              <Trophy className="w-5 h-5 text-emerald-400" />
            </div>
            <h4 className="text-base font-bold text-white mb-2">4. Earn Points</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Receive full points when all test cases pass. Climb the college leaderboard and track your semester progress.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
