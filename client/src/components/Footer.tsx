import React from 'react';
import { Link } from 'react-router-dom';
import { Code2, Terminal, Shield, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto bg-[#07090f] border-t border-slate-800/80 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-violet-600 p-0.5">
                <div className="w-full h-full bg-[#0a0d14] rounded-[6px] flex items-center justify-center">
                  <Code2 className="w-4 h-4 text-blue-400" />
                </div>
              </div>
              <span className="text-lg font-black tracking-wider text-white">CODE ARENA</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Official programming practice and automated evaluation platform for college engineering students. Master
              fundamentals to advanced algorithms.
            </p>
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Real Online Judge (C, C++, Java, Python)</span>
            </div>
          </div>

          {/* Academic Years */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">Academic Roadmap</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/problems?year=1st+Year" className="hover:text-blue-400 transition-colors">
                  1st Year: Programming Fundamentals
                </Link>
              </li>
              <li>
                <Link to="/problems?year=2nd+Year" className="hover:text-purple-400 transition-colors">
                  2nd Year: Data Structures & Algorithms
                </Link>
              </li>
              <li>
                <Link to="/problems?year=3rd+Year" className="hover:text-indigo-400 transition-colors">
                  3rd Year: Advanced Algorithms & DP
                </Link>
              </li>
              <li>
                <Link to="/leaderboard" className="hover:text-amber-400 transition-colors">
                  College Leaderboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Supported Languages & Judge */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">Runtimes & Standards</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                <span>C (GCC 9.2 / 10.2 / 14)</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                <span>C++ (G++ 14 / Clang)</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                <span>Java (OpenJDK 17 / 21)</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Python (3.10 / 3.11 / 3.12)</span>
              </li>
            </ul>
          </div>

          {/* Administrative */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">Administration & Access</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/admin" className="hover:text-purple-400 flex items-center space-x-1 transition-colors">
                  <Shield className="w-3.5 h-3.5 text-purple-400" />
                  <span>Admin Question Management</span>
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-blue-400 transition-colors">
                  Sign In Portal
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-blue-400 transition-colors">
                  Student Registration
                </Link>
              </li>
              <li className="pt-2 text-[11px] text-slate-500">
                Sandboxed evaluation engine with automated time and memory limits.
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} CODE ARENA. All rights reserved.</p>
          <p className="flex items-center space-x-1 mt-2 sm:mt-0">
            <span>Built for college students with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline mx-0.5" />
            <span>and modern web standards</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
