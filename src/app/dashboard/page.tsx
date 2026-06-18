'use client';

import React, { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DateHeader from '@/components/dashboard/DateHeader';
import ScoreInput from '@/components/dashboard/ScoreInput';
import ScoreGraph from '@/components/dashboard/ScoreGraph';
import TaskList from '@/components/dashboard/TaskList';
import DailyNote from '@/components/dashboard/DailyNote';
import MiniCalendar from '@/components/dashboard/MiniCalendar';
import { getLocalDateString } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

function DashboardContent() {
  const searchParams = useSearchParams();
  const { selectedDate, setSelectedDate } = useApp();

  // Sync date from URL query parameter (?date=YYYY-MM-DD) to context
  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      setSelectedDate(dateParam);
    } else if (!selectedDate) {
      setSelectedDate(getLocalDateString());
    }
  }, [searchParams, setSelectedDate, selectedDate]);

  const activeDate = selectedDate || getLocalDateString();

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Date Title Header & Co */}
        <DateHeader />

        {/* 12-Column Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Dashboard Workspace (8 columns) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Score Input Card */}
            <ScoreInput date={activeDate} />

            {/* Score History Graph */}
            <ScoreGraph />

            {/* Tasks & Notes Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TaskList date={activeDate} />
              <DailyNote date={activeDate} />
            </div>
          </div>

          {/* Sidebar Widgets (4 columns) */}
          <div className="lg:col-span-4">
            <MiniCalendar />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-bg-primary">
          <Loader2 className="w-8 h-8 text-accent-blue animate-spin" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
