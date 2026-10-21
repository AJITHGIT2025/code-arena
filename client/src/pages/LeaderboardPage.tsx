import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { YearBadge } from '../components/Badge';
import { Trophy, Search } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  academicYear: string;
  solvedCount: number;
  totalPoints: number;
  lastActive: string | null;
}

export const LeaderboardPage: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedYear]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedYear !== 'All') params.year = selectedYear;

      const res = await api.get('/stats/leaderboard', { params });
      setLeaderboard(res.data.leaderboard || []);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = leaderboard.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const top3 = filtered.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-400 mb-3">
            <Trophy className="w-4 h-4" />
            <span>Hall of Fame & Rankings</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            College Arena Leaderboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Points are awarded upon passing all hidden test cases. Rankings prioritize total points earned, followed by
            number of problems solved.
          </p>
        </div>

        <div className="flex justify-center space-x-2 mb-8 overflow-x-auto pb-1">
          {['All', '1st Year', '2nd Year', '3rd Year'].map((yr) => (
            <button
              key={yr}
              onClick={() => setSelectedYear(yr)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedYear === yr
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-[#111622] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {yr === 'All' ? 'Overall Campus' : yr}
            </button>
          ))}
        </div>

        {top3.length >= 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10 max-w-4xl mx-auto items-end">
            <div className="order-2 md:order-1 p-5 rounded-2xl bg-[#111622] border border-slate-700/60 text-center relative hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-3 text-slate-200 font-black text-lg border-2 border-slate-400 shadow-lg">
                2
              </div>
              <h3 className="font-bold text-white text-base truncate">{top3[1].name}</h3>
              <div className="mt-1">
                <YearBadge year={top3[1].academicYear} />
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 flex justify-around text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Solved</span>
                  <span className="font-bold text-white">{top3[1].solvedCount}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Points</span>
                  <span className="font-bold text-blue-400">{top3[1].totalPoints}</span>
                </div>
              </div>
            </div>

            <div className="order-1 md:order-2 p-6 rounded-2xl bg-gradient-to-b from-[#161c2c] to-[#111622] border-2 border-amber-500/60 text-center relative hover:-translate-y-1 transition-transform shadow-2xl shadow-amber-500/10 -mt-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-400 flex items-center justify-center mx-auto mb-3 text-white font-black text-2xl border-4 border-yellow-200 shadow-xl shadow-amber-500/30">
                👑
              </div>
              <h3 className="font-extrabold text-white text-lg truncate">{top3[0].name}</h3>
              <div className="mt-1">
                <YearBadge year={top3[0].academicYear} />
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 flex justify-around text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Solved</span>
                  <span className="font-extrabold text-white text-sm">{top3[0].solvedCount}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Points</span>
                  <span className="font-extrabold text-amber-400 text-sm">{top3[0].totalPoints}</span>
                </div>
              </div>
            </div>

            <div className="order-3 p-5 rounded-2xl bg-[#111622] border border-amber-800/40 text-center relative hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 rounded-full bg-amber-900/60 flex items-center justify-center mx-auto mb-3 text-amber-400 font-black text-lg border-2 border-amber-600 shadow-lg">
                3
              </div>
              <h3 className="font-bold text-white text-base truncate">{top3[2].name}</h3>
              <div className="mt-1">
                <YearBadge year={top3[2].academicYear} />
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 flex justify-around text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Solved</span>
                  <span className="font-bold text-white">{top3[2].solvedCount}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Points</span>
                  <span className="font-bold text-blue-400">{top3[2].totalPoints}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-md mx-auto mb-6 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#111622] border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="bg-[#111622] border border-slate-800 rounded-2xl overflow-hidden shadow-xl max-w-4xl mx-auto">
          {loading ? (
            <div className="py-16 text-center text-slate-500 text-xs">Loading rankings...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">No active students on this leaderboard yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-900/80 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4 w-16 text-center">Rank</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Academic Year</th>
                    <th className="py-3 px-4 text-center">Problems Solved</th>
                    <th className="py-3 px-4 text-right">Points Earned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold">
                        {item.rank === 1 ? (
                          <span className="text-amber-400 text-base">🥇</span>
                        ) : item.rank === 2 ? (
                          <span className="text-slate-300 text-base">🥈</span>
                        ) : item.rank === 3 ? (
                          <span className="text-amber-600 text-base">🥉</span>
                        ) : (
                          <span className="text-slate-400">#{item.rank}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white">{item.name}</td>
                      <td className="py-3.5 px-4">
                        <YearBadge year={item.academicYear} />
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-300 font-semibold">{item.solvedCount}</td>
                      <td className="py-3.5 px-4 text-right font-black text-blue-400">{item.totalPoints} pts</td>
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
