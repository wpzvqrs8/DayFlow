'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { TrendingUp, Flame, CheckCircle, BarChart3, Loader2, ArrowUp, ArrowDown, Activity } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/analytics/StatCard';
import WeeklyTrend from '@/components/analytics/WeeklyTrend';
import Heatmap from '@/components/analytics/Heatmap';
import { AnalyticsData } from '@/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AnalyticsPage() {
  const { data: stats, error, isLoading } = useSWR<AnalyticsData>('/api/analytics', fetcher);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <DashboardLayout>
        <div className="min-h-[400px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-accent-blue animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-accent-blue animate-spin" />
            <span className="text-xs text-text-secondary font-semibold">Analyzing your logs...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !stats) {
    return (
      <DashboardLayout>
        <div className="min-h-[400px] flex items-center justify-center text-center text-xs text-accent-red">
          Failed to load analytics data. Make sure reports exist.
        </div>
      </DashboardLayout>
    );
  }

  const taskCompletionRate = stats.taskCompletionRate ?? 0;
  
  // Donut chart data for task completion
  const donutData = [
    { name: 'Completed', value: stats.completedTasks || 0, color: '#22C55E' },
    { name: 'Remaining', value: Math.max(0, (stats.totalTasks || 0) - (stats.completedTasks || 0)), color: '#F8F7FA' },
  ];

  // Adjust for 0 tasks logged
  if (donutData[0].value === 0 && donutData[1].value === 0) {
    donutData[1].value = 1;
    donutData[1].color = '#E7E5EA';
  }

  const isAvgPositive = stats.averageScoreTrend >= 0;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Page Header */}
        <div className="flex items-center gap-3 select-none">
          <div className="w-10 h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center text-accent-blue">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-text-primary tracking-tight">Analytics & Insights</h1>
            <p className="text-xs text-text-secondary mt-0.5">Statistical deep-dive into your routines and consistency.</p>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* average score card */}
          <StatCard
            title="Average Score"
            value={stats.averageScore}
            icon={Activity}
            variant="blue"
            description={
              stats.averageScoreTrend !== 0 ? (
                <>
                  <span className={`flex items-center font-bold ${isAvgPositive ? 'text-accent-green' : 'text-accent-red'}`}>
                    {isAvgPositive ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
                    {Math.abs(stats.averageScoreTrend)}
                  </span>
                  <span>vs last month</span>
                </>
              ) : (
                <span>Stable trend</span>
              )
            }
          />

          {/* consistency streak card */}
          <StatCard
            title="Consistency Streak"
            value={`${stats.streak} Days`}
            icon={Flame}
            variant="orange"
            description={
              stats.streak > 0 ? (
                <span className="text-accent-orange font-bold">Keep it up! 🔥</span>
              ) : (
                <span>Start logging today!</span>
              )
            }
          />

          {/* task completion card */}
          <StatCard
            title="Tasks Completed"
            value={`${stats.completedTasks} / ${stats.totalTasks}`}
            icon={CheckCircle}
            variant="green"
            description={
              <span>Last 30 days rate: <span className="text-accent-green font-bold">{taskCompletionRate}%</span></span>
            }
          />
        </div>

        {/* Charts & Visualizations Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Weekly Trend Chart (8 columns) */}
          <div className="lg:col-span-8 bg-bg-card border border-border-soft rounded-card shadow-card p-6 flex flex-col gap-5 hover:shadow-card-hover transition-all duration-300">
            <div>
              <h2 className="text-base font-semibold text-text-primary">Weekly Assessment</h2>
              <p className="text-xs text-text-secondary mt-0.5">Last 7 days daily performance overview.</p>
            </div>
            <WeeklyTrend data={stats.weeklyTrend} averageScore={stats.averageScore} />
          </div>

          {/* Donut Chart (4 columns) */}
          <div className="lg:col-span-4 bg-bg-card border border-border-soft rounded-card shadow-card p-6 flex flex-col gap-5 hover:shadow-card-hover transition-all duration-300">
            <div>
              <h2 className="text-base font-semibold text-text-primary">Task Completion</h2>
              <p className="text-xs text-text-secondary mt-0.5">Tasks completion breakdown (30 days).</p>
            </div>
            
            <div className="w-full h-[180px] relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Centered Donut Label */}
              <div className="absolute flex flex-col items-center justify-center select-none">
                <span className="text-2xl font-extrabold text-text-primary tracking-tighter">{taskCompletionRate}%</span>
                <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest mt-0.5">Completed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Heatmap Contribution Section (Full width / 12 columns) */}
        <div className="bg-bg-card border border-border-soft rounded-card shadow-card p-6 flex flex-col gap-5 hover:shadow-card-hover transition-all duration-300">
          <div>
            <h2 className="text-base font-semibold text-text-primary">Consistency Matrix</h2>
            <p className="text-xs text-text-secondary mt-0.5">Contribution-style mapping of scores for the last 30 days.</p>
          </div>
          <Heatmap data={stats.monthlyHeatmap} />
        </div>
      </div>
    </DashboardLayout>
  );
}
