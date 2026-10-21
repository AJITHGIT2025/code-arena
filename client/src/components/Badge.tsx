import React from 'react';
import { DifficultyLevel, AcademicYear } from '../types';

export const DifficultyBadge: React.FC<{ difficulty: DifficultyLevel | string }> = ({ difficulty }) => {
  switch (difficulty) {
    case 'Easy':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          Easy
        </span>
      );
    case 'Medium':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          Medium
        </span>
      );
    case 'Hard':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          Hard
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
          {difficulty}
        </span>
      );
  }
};

export const YearBadge: React.FC<{ year: AcademicYear | string }> = ({ year }) => {
  switch (year) {
    case '1st Year':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
          1st Year
        </span>
      );
    case '2nd Year':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
          2nd Year
        </span>
      );
    case '3rd Year':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          3rd Year
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
          {year}
        </span>
      );
  }
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'Accepted':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          ✓ Accepted
        </span>
      );
    case 'Wrong Answer':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
          ✗ Wrong Answer
        </span>
      );
    case 'Compilation Error':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
          ⚠ Compilation Error
        </span>
      );
    case 'Time Limit Exceeded':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-orange-500/15 text-orange-400 border border-orange-500/30">
          ⏱ Time Limit Exceeded
        </span>
      );
    case 'Runtime Error':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30">
          ⚡ Runtime Error
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/30">
          {status}
        </span>
      );
  }
};
