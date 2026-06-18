'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { ChevronLeft, ChevronRight, FileText, CheckCircle2, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { getLocalDateString, getScoreColor } from '@/lib/utils';
import { useApp } from '@/context/AppContext';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  format,
  parseISO
} from 'date-fns';
import IconContainer from '@/components/shared/IconContainer';

export default function CalendarPage() {
  const router = useRouter();
  const { setSelectedDate } = useApp();
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 1. Fetch reports
  const { data: reports, isLoading: reportsLoading } = useSWR('calendar-page-reports', async () => {
    const { data } = await supabase.from('daily_reports').select('date, score');
    return data || [];
  });

  // 2. Fetch notes
  const { data: notes, isLoading: notesLoading } = useSWR('calendar-page-notes', async () => {
    const { data } = await supabase.from('daily_notes').select('date');
    return data || [];
  });

  // 3. Fetch tasks
  const { data: tasks, isLoading: tasksLoading } = useSWR('calendar-page-tasks', async () => {
    const { data } = await supabase.from('tasks').select('date, is_completed');
    return data || [];
  });

  if (!isMounted) {
    return (
      <DashboardLayout>
        <div className="min-h-[400px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-accent-purple animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  // Organize data in maps
  const reportsMap = new Map(reports?.map((r) => [r.date, r.score]) || []);
  const notesSet = new Set(notes?.map((n) => n.date) || []);
  
  // Group tasks by date
  const tasksMap = new Map<string, { total: number; completed: number }>();
  if (tasks) {
    tasks.forEach((t) => {
      const current = tasksMap.get(t.date) || { total: 0, completed: 0 };
      current.total += 1;
      if (t.is_completed) current.completed += 1;
      tasksMap.set(t.date, current);
    });
  }

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const handleCellClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    router.push(`/dashboard?date=${dateStr}`);
  };

  const today = new Date();
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const pageLoading = reportsLoading || notesLoading || tasksLoading;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Header Navigation Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
          <div className="flex items-center gap-3">
            <IconContainer icon={CalendarIcon} variant="purple" />
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-text-primary tracking-tight">
                {format(currentMonth, 'MMMM yyyy')}
              </h1>
              <p className="text-xs text-text-secondary mt-0.5">Explore tasks, scores and logs by month.</p>
            </div>
          </div>

          <div className="flex items-center border border-border-soft rounded-xl shadow-sm h-10 bg-bg-card overflow-hidden">
            <button
              onClick={handlePrevMonth}
              className="w-10 h-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors cursor-pointer border-r border-border-soft"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="w-10 h-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Large Calendar Grid */}
        {pageLoading ? (
          <div className="min-h-[400px] flex items-center justify-center bg-bg-card border border-border-soft rounded-card shadow-card">
            <Loader2 className="w-8 h-8 text-accent-purple animate-spin" />
          </div>
        ) : (
          <div className="bg-bg-card border border-border-soft rounded-card shadow-card p-4 overflow-x-auto">
            <div className="min-w-[700px] flex flex-col">
              {/* Day Titles */}
              <div className="grid grid-cols-7 text-center text-[10px] font-bold text-text-secondary/80 uppercase tracking-widest border-b border-border-soft/60 pb-3 mb-2">
                {weekdays.map((w) => (
                  <span key={w}>{w}</span>
                ))}
              </div>

              {/* Grid Cells */}
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, idx) => {
                  const dayStr = getLocalDateString(day);
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isToday = isSameDay(day, today);
                  const score = reportsMap.get(dayStr);
                  const hasNote = notesSet.has(dayStr);
                  const dayTasks = tasksMap.get(dayStr);

                  // Score badge coloring
                  const scoreColor = score !== undefined ? getScoreColor(score) : null;

                  return (
                    <div
                      key={idx}
                      onClick={() => handleCellClick(dayStr)}
                      className={`min-h-[105px] border rounded-xl p-2.5 flex flex-col justify-between transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md select-none group ${
                        isCurrentMonth
                          ? 'bg-bg-card border-border-soft hover:bg-bg-secondary/40'
                          : 'bg-bg-secondary/30 border-border-soft/40 text-text-muted/40 hover:bg-bg-secondary/50'
                      } ${isToday ? 'ring-2 ring-accent-blue/30' : ''}`}
                    >
                      {/* Top Row: Date Number & Note/Today indicator */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                            isToday
                              ? 'bg-accent-blue text-white shadow-sm'
                              : isCurrentMonth
                              ? 'text-text-primary group-hover:text-accent-blue'
                              : 'text-text-muted/40'
                          }`}
                        >
                          {format(day, 'd')}
                        </span>
                        
                        {/* Note & Task Icons */}
                        <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          {hasNote && <FileText className="w-3.5 h-3.5 text-accent-orange" />}
                        </div>
                      </div>

                      {/* Middle Row: Score Pill */}
                      <div className="my-1.5 flex justify-start">
                        {scoreColor && (
                          <span
                            className={`text-[10px] font-bold py-0.5 px-2 rounded-full border shadow-sm ${scoreColor.bg} ${scoreColor.border} ${scoreColor.text}`}
                          >
                            Score: {score}
                          </span>
                        )}
                      </div>

                      {/* Bottom Row: Task Progress Mini-bar */}
                      <div className="mt-auto">
                        {dayTasks && dayTasks.total > 0 ? (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[9px] text-text-secondary/80 font-bold">
                              <span className="flex items-center gap-0.5">
                                <CheckCircle2 className="w-2.5 h-2.5 text-accent-green" />
                                {dayTasks.completed}/{dayTasks.total}
                              </span>
                              <span>{Math.round((dayTasks.completed / dayTasks.total) * 100)}%</span>
                            </div>
                            <div className="w-full h-1 bg-bg-secondary border border-border-soft/20 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-accent-green rounded-full transition-all duration-300"
                                style={{ width: `${(dayTasks.completed / dayTasks.total) * 100}%` }}
                              />
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
