import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Code2,
  Terminal,
  Trophy,
  LayoutDashboard,
  Shield,
  LogOut,
  User,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  const navLinks = [
    { name: 'Problems', path: '/problems' },
    { name: '1st Year', path: '/problems?year=1st+Year' },
    { name: '2nd Year', path: '/problems?year=2nd+Year' },
    { name: '3rd Year', path: '/problems?year=3rd+Year' },
    { name: 'Leaderboard', path: '/leaderboard' },
  ];

  const isActive = (path: string) => {
    if (path.includes('?')) {
      return location.pathname + location.search === path;
    }
    return location.pathname === path && !location.search;
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#0a0d14]/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 p-0.5 shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all duration-300">
              <div className="w-full h-full bg-[#0a0d14] rounded-[10px] flex items-center justify-center">
                <Code2 className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform duration-200" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-1.5">
                <span className="text-xl font-black tracking-wider text-white">CODE</span>
                <span className="text-xl font-black tracking-wider bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 text-transparent bg-clip-text">
                  ARENA
                </span>
              </div>
              <span className="text-[10px] uppercase font-semibold tracking-widest text-slate-500 -mt-1">
                College Practice Portal
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isActive(link.path)
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Right Action Section */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                {isAdmin ? (
                  <Link
                    to="/admin"
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30 hover:bg-purple-500/25 transition-all"
                  >
                    <Shield className="w-3.5 h-3.5 text-purple-400" />
                    <span>Admin Panel</span>
                  </Link>
                ) : (
                  <Link
                    to="/dashboard"
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30 hover:bg-blue-500/25 transition-all"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-blue-400" />
                    <span>My Dashboard</span>
                  </Link>
                )}

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-200 text-sm font-medium transition-all"
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white uppercase">
                      {user?.name?.charAt(0) || 'U'}
                    </div>
                    <span className="max-w-[120px] truncate">{user?.name}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-[#111622] border border-slate-800 rounded-xl shadow-2xl py-2 z-50">
                      <div className="px-4 py-2 border-b border-slate-800/80">
                        <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                        <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                        <span className="inline-block mt-1 text-[11px] font-medium px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          {user?.role === 'ADMIN' ? 'Administrator' : user?.academicYear}
                        </span>
                      </div>

                      {user?.role === 'STUDENT' && (
                        <Link
                          to="/dashboard"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/60"
                        >
                          <LayoutDashboard className="w-4 h-4 text-blue-400" />
                          <span>Student Dashboard</span>
                        </Link>
                      )}

                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/60"
                        >
                          <Shield className="w-4 h-4 text-purple-400" />
                          <span>Admin Console</span>
                        </Link>
                      )}

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="hidden lg:flex items-center text-xs text-slate-400 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                  Guest Mode
                </div>
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-all"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-lg shadow-md shadow-blue-600/20 hover:shadow-blue-600/40 transition-all"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0a0d14] border-b border-slate-800 px-4 pt-2 pb-5 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-base font-medium ${
                isActive(link.path)
                  ? 'bg-blue-600/20 text-blue-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {link.name}
            </Link>
          ))}

          <div className="pt-3 border-t border-slate-800/80 space-y-2">
            {isAuthenticated ? (
              <>
                <div className="px-3 py-2 bg-slate-900 rounded-lg">
                  <div className="text-sm font-semibold text-white">{user?.name}</div>
                  <div className="text-xs text-slate-400">{user?.email}</div>
                </div>

                {isAdmin ? (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm font-medium bg-purple-600/20 text-purple-300"
                  >
                    Admin Console
                  </Link>
                ) : (
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm font-medium bg-blue-600/20 text-blue-300"
                  >
                    Student Dashboard
                  </Link>
                )}

                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 rounded-lg"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
