'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { getLocalDateString, formatDisplayDate } from '@/lib/utils';
import { addDays, subDays, parseISO } from 'date-fns';

export default function DateHeader() {
  const { selectedDate, setSelectedDate } = useApp();

  const handlePrevDay = () => {
    if (!selectedDate) return;
    const prevDate = subDays(parseISO(selectedDate), 1);
    setSelectedDate(getLocalDateString(prevDate));
  };

  const handleNextDay = () => {
    if (!selectedDate) return;
    const nextDate = addDays(parseISO(selectedDate), 1);
    setSelectedDate(getLocalDateString(nextDate));
  };

  const handleBackToToday = () => {
    setSelectedDate(getLocalDateString());
  };

  const isTodaySelected = selectedDate === getLocalDateString();

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      {/* Date Title & Navigation */}
      <div className="flex items-center gap-3">
        {/* Navigation Arrows */}
        <div className="flex items-center bg-bg-card border border-border-soft rounded-xl shadow-sm overflow-hidden h-10 select-none">
          <button
            onClick={handlePrevDay}
            className="w-10 h-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors cursor-pointer border-r border-border-soft"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleNextDay}
            className="w-10 h-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors cursor-pointer"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Date Display Text */}
        <h1 className="text-xl sm:text-2xl font-semibold text-text-primary tracking-tight select-none">
          {formatDisplayDate(selectedDate || getLocalDateString())}
        </h1>
      </div>

      {/* Return to Today */}
      {!isTodaySelected && (
        <button
          onClick={handleBackToToday}
          className="bg-accent-blue/10 hover:bg-accent-blue/15 text-accent-blue font-semibold text-xs py-2.5 px-4 rounded-xl border border-accent-blue/15 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer self-start md:self-auto select-none"
        >
          <CalendarDays className="w-3.5 h-3.5" />
          <span>Back to Today</span>
        </button>
      )}
    </div>
  );
}
