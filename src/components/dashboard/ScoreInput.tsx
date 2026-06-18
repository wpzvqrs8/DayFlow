'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Minus, Info } from 'lucide-react';
import { useDailyReport } from '@/hooks/useDailyReport';
import { getLocalDateString, getScoreColor } from '@/lib/utils';

interface ScoreInputProps {
  date: string;
}

export default function ScoreInput({ date }: ScoreInputProps) {
  const { report, updateReport, isLoading } = useDailyReport(date);
  const isToday = date === getLocalDateString();

  const [score, setScore] = useState<number>(50);
  const [displayScore, setDisplayScore] = useState<number>(50);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Update score state when SWR data loads
  useEffect(() => {
    if (report) {
      setScore(report.score);
    }
  }, [report]);

  // 2. Count-up/down animation for displayScore
  useEffect(() => {
    if (displayScore === score) return;
    
    const step = displayScore < score ? 1 : -1;
    const duration = Math.min(300, Math.abs(score - displayScore) * 10);
    const intervalTime = Math.max(5, duration / Math.abs(score - displayScore));

    const interval = setInterval(() => {
      setDisplayScore((prev) => {
        if (prev === score) {
          clearInterval(interval);
          return prev;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [score, displayScore]);

  // 3. Debounced save to Supabase
  const handleScoreChange = (newScore: number) => {
    const cleanScore = Math.max(0, Math.min(100, newScore));
    setScore(cleanScore);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      updateReport({ score: cleanScore }).catch((err) => {
        console.error('Failed to update score:', err);
      });
    }, 500); // 500ms debounce
  };

  const increment = () => handleScoreChange(score + 5);
  const decrement = () => handleScoreChange(score - 5);

  const colors = getScoreColor(displayScore);

  return (
    <div className="bg-bg-card border border-border-soft rounded-card shadow-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 select-none transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5">
      {/* Metric Display */}
      <div className="flex items-center gap-4">
        <div
          className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center border font-bold text-3xl transition-all duration-500 shadow-sm ${colors.bg} ${colors.border} ${colors.text}`}
        >
          {displayScore}
          <span className="text-[10px] uppercase tracking-wider font-semibold opacity-80 mt-0.5">Score</span>
        </div>

        <div>
          <h2 className="text-base font-semibold text-text-primary">Daily Assessment</h2>
          <p className="text-xs text-text-secondary mt-0.5">
            {isToday ? 'How is your day going? Adjust the score below.' : 'Read-only view for past dates.'}
          </p>
        </div>
      </div>

      {/* Editor (Slider + Buttons) - Only if Today */}
      {isToday ? (
        <div className="flex-1 max-w-md flex flex-col sm:flex-row items-center gap-4">
          {/* Decrement Button */}
          <button
            onClick={decrement}
            disabled={score <= 0}
            className="w-10 h-10 rounded-xl bg-bg-secondary hover:bg-border-soft border border-border-soft/60 flex items-center justify-center text-text-secondary hover:text-text-primary transition-all disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            <Minus className="w-4 h-4" />
          </button>

          {/* Slider */}
          <div className="flex-1 w-full flex flex-col gap-1">
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={score}
              onChange={(e) => handleScoreChange(Number(e.target.value))}
              className="w-full h-2 bg-bg-secondary rounded-lg appearance-none cursor-pointer accent-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
            />
            <div className="flex justify-between text-[10px] text-text-muted font-semibold mt-1">
              <span>0 (Challenging)</span>
              <span>50 (Neutral)</span>
              <span>100 (Exceptional)</span>
            </div>
          </div>

          {/* Increment Button */}
          <button
            onClick={increment}
            disabled={score >= 100}
            className="w-10 h-10 rounded-xl bg-bg-secondary hover:bg-border-soft border border-border-soft/60 flex items-center justify-center text-text-secondary hover:text-text-primary transition-all disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      ) : (
        // Read-only indicator
        <div className="flex items-center gap-2 text-xs text-text-secondary bg-bg-secondary border border-border-soft/60 py-2 px-4 rounded-xl">
          <Info className="w-4 h-4 text-text-muted shrink-0" />
          <span>Scores on past dates are preserved.</span>
        </div>
      )}
    </div>
  );
}
