import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Pages
import { HomePage } from './pages/HomePage';
import { ProblemsPage } from './pages/ProblemsPage';
import { ProblemWorkspacePage } from './pages/ProblemWorkspacePage';
import { DashboardPage } from './pages/DashboardPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminProblemFormPage } from './pages/AdminProblemFormPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-[#0a0d14] flex flex-col font-sans text-slate-100 selection:bg-blue-600 selection:text-white">
          <Navbar />
          <main className="flex-1 flex flex-col">
            <Routes>
              {/* Public & Student Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/problems" element={<ProblemsPage />} />
              <Route path="/problems/:codeOrId" element={<ProblemWorkspacePage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />

              {/* Authentication Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Admin Portal Routes */}
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/problems/create" element={<AdminProblemFormPage />} />
              <Route path="/admin/problems/edit/:id" element={<AdminProblemFormPage />} />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
