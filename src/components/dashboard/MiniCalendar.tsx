'use client';

import React, { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { getLocalDateString } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
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
  addDays,
  subDays,
  format,
  parseISO
} from 'date-fns';
import IconContainer from '../shared/IconContainer';

export default function MiniCalendar() {
  const { selectedDate, setSelectedDate } = useApp();
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [focusedDate, setFocusedDate] = useState<Date>(new Date());
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync currentMonth and focusedDate with global selectedDate
  useEffect(() => {
    if (selectedDate) {
      const parsed = parseISO(selectedDate);
      setCurrentMonth(parsed);
      setFocusedDate(parsed);
    }
  }, [selectedDate]);

  // Fetch reports data for dot indicators
  const { data: reports } = useSWR('calendar-reports-dots', async () => {
    const { data } = await supabase.from('daily_reports').select('date, score');
    return data || [];
  });

  // Fetch notes data for dot indicators
  const { data: notes } = useSWR('calendar-notes-dots', async () => {
    const { data } = await supabase.from('daily_notes').select('date');
    return data || [];
  });

  const reportsMap = new Map(reports?.map(r => [r.date, r.score]) || []);
  const notesSet = new Set(notes?.map(n => n.date) || []);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  // Calendar dates generation
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  // 1. Keyboard navigation listener
  const handleKeyDown = (e: React.KeyboardEvent) => {
    let nextFocus: Date | null = null;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        nextFocus = subDays(focusedDate, 7);
        break;
      case 'ArrowDown':
        e.preventDefault();
        nextFocus = addDays(focusedDate, 7);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        nextFocus = subDays(focusedDate, 1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        nextFocus = addDays(focusedDate, 1);
        break;
      case 'Enter':
        e.preventDefault();
        setSelectedDate(getLocalDateString(focusedDate));
        break;
      default:
        return;
    }

    if (nextFocus) {
      setFocusedDate(nextFocus);
      // Auto-update visible month if focused date goes out of bounds
      if (nextFocus.getMonth() !== currentMonth.getMonth()) {
        setCurrentMonth(startOfMonth(nextFocus));
      }
    }
  };

  // 2. Select Date handler
  const handleDateSelect = (date: Date) => {
    setSelectedDate(getLocalDateString(date));
    setFocusedDate(date);
  };

  const today = new Date();
  const parsedSelected = selectedDate ? parseISO(selectedDate) : null;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="bg-bg-card border border-border-soft rounded-card shadow-card p-6 flex flex-col gap-4 select-none transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 outline-none focus:ring-2 focus:ring-accent-purple/20"
    >
      {/* Month Year Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <IconContainer icon={Calendar} variant="purple" />
          <div>
            <h2 className="text-base font-semibold text-text-primary">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <p className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider">
              Calendar View
            </p>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center border border-border-soft rounded-xl overflow-hidden shadow-sm h-9 bg-bg-card">
          <button
            onClick={handlePrevMonth}
            className="w-9 h-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors cursor-pointer border-r border-border-soft"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNextMonth}
            className="w-9 h-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 7-column Grid Header */}
      <div className="grid grid-cols-7 text-center text-[10px] font-bold text-text-secondary/70 uppercase tracking-widest border-b border-border-soft/40 pb-2">
        <span>Sun</span>
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-y-2.5 text-center mt-1">
        {calendarDays.map((day, idx) => {
          const dayStr = getLocalDateString(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, today);
          const isSelected = parsedSelected && isSameDay(day, parsedSelected);
          const isFocused = isSameDay(day, focusedDate);

          // Dot indicator checks
          const score = reportsMap.get(dayStr);
          const hasNote = notesSet.has(dayStr);
          let dotColorClass = '';

          if (score !== undefined) {
            if (score >= 80) dotColorClass = 'bg-accent-green';
            else if (score >= 60) dotColorClass = 'bg-accent-blue';
            else if (score >= 40) dotColorClass = 'bg-accent-orange';
            else dotColorClass = 'bg-accent-red';
          } else if (hasNote) {
            dotColorClass = 'border border-accent-blue bg-transparent';
          }

          return (
            <div
              key={idx}
              onClick={() => handleDateSelect(day)}
              className="flex flex-col items-center justify-center relative py-1 cursor-pointer"
            >
              {/* Day Circle Container */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all select-none hover:scale-105 duration-200 relative ${
                  isSelected
                    ? 'bg-accent-purple text-white shadow-md shadow-accent-purple/20'
                    : isToday
                    ? 'bg-accent-blue text-white shadow-md shadow-accent-blue/20'
                    : isCurrentMonth
                    ? 'text-text-primary hover:bg-bg-secondary'
                    : 'text-text-muted/50 hover:bg-bg-secondary/40'
                } ${isFocused ? 'ring-2 ring-accent-purple/40 ring-offset-1' : ''}`}
              >
                {format(day, 'd')}
              </div>

              {/* Data Indicator Dot */}
              <div className="h-1 flex items-center justify-center mt-0.5">
                {dotColorClass && (
                  <span className={`w-1 h-1 rounded-full shrink-0 ${dotColorClass}`} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="text-[9px] font-semibold text-text-muted mt-2 text-center select-none uppercase tracking-widest opacity-80">
        Use Arrow Keys & Enter to navigate calendar
      </div>
    </div>
  );
}
