import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Code2, Lock, Mail, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await login(email, password);
    setSubmitting(false);

    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.error || 'Failed to sign in.');
    }
  };

  const handleQuickFillStudent = () => {
    setEmail('student@codearena.com');
    setPassword('Student@123');
    setError(null);
  };

  const handleQuickFillAdmin = () => {
    setEmail('admin@codearena.com');
    setPassword('Admin@CodeArena2026!');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0d14] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center space-x-2.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-violet-600 p-0.5 shadow-lg shadow-blue-500/20">
            <div className="w-full h-full bg-[#0a0d14] rounded-[10px] flex items-center justify-center">
              <Code2 className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <span className="text-2xl font-black tracking-wider text-white">CODE ARENA</span>
        </Link>
        <h2 className="text-2xl font-extrabold text-white">Sign In to Your Account</h2>
        <p className="mt-1 text-xs text-slate-400">
          Or{' '}
          <Link to="/register" className="font-semibold text-blue-400 hover:text-blue-300">
            register a new student account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-[#111622] py-8 px-6 sm:px-10 border border-slate-800 rounded-2xl shadow-2xl space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-900/60 text-xs text-rose-300 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@college.edu"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0a0d14] border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0a0d14] border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{submitting ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick-Fill Demo Credentials Helper */}
          <div className="pt-4 border-t border-slate-800/80">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2 text-center">
              Quick Demo Access
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleQuickFillStudent}
                className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700/60 transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Demo Student</span>
              </button>

              <button
                type="button"
                onClick={handleQuickFillAdmin}
                className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700/60 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>Admin Login</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
