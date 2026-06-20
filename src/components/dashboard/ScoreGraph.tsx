'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getLocalDateString } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { subDays, format, parseISO, eachDayOfInterval } from 'date-fns';
import { TrendingUp, Calendar, Loader2 } from 'lucide-react';
import IconContainer from '../shared/IconContainer';
import StreakBadge from './StreakBadge';
import { useApp } from '@/context/AppContext';

type Range = '7d' | '30d' | 'all';

// Custom Tooltip Component
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    return (
      <div className="bg-bg-card border border-border-soft shadow-lg rounded-xl p-3 max-w-[240px] select-none text-xs">
        <div className="font-semibold text-text-primary mb-1">
          {format(parseISO(data.date), 'EEEE, MMM d')}
        </div>
        <div className="flex items-center gap-1.5 font-bold mb-2">
          <span className="text-text-secondary">Score:</span>
          <span
            style={{
              color:
                data.score >= 80
                  ? '#22C55E'
                  : data.score >= 60
                  ? '#3B82F6'
                  : data.score >= 40
                  ? '#F59E0B'
                  : '#EF4444',
            }}
          >
            {data.score}
            {data.isMissing && <span className="text-[10px] text-text-muted font-normal ml-1">(Neutral)</span>}
          </span>
        </div>
        <p className="text-text-secondary line-clamp-2 italic leading-relaxed">
          "{data.preview}"
        </p>
      </div>
    );
  }
  return null;
};

export default function ScoreGraph() {
  const { setSelectedDate } = useApp();
  const [range, setRange] = useState<Range>('30d');
  const [isMounted, setIsMounted] = useState(false);

  // Avoid SSR hydration issues with Recharts
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch reports directly from Supabase
  const { data: reports, error, isLoading } = useSWR('reports-list-graph', async () => {
    const { data, error } = await supabase
      .from('daily_reports')
      .select('date, score, accomplishments, reflections')
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  });

  if (!isMounted) {
    return (
      <div className="bg-bg-card border border-border-soft rounded-card shadow-card p-6 h-[320px] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-accent-purple animate-spin" />
      </div>
    );
  }

  // Generate data based on range
  const generateChartData = () => {
    if (!reports) return [];

    const todayStr = getLocalDateString();
    const todayDate = parseISO(todayStr);

    // Filter out future dates to ensure the graph line ends at today's point
    const filteredReports = reports.filter((r) => r.date <= todayStr);

    const reportsMap = new Map(
      filteredReports.map((r) => [
        r.date,
        {
          score: r.score,
          preview: r.accomplishments || r.reflections || 'No highlights recorded.',
        },
      ])
    );

    const earliestReportDateStr = filteredReports.length > 0 ? filteredReports[0].date : todayStr;
    const earliestReportDate = parseISO(earliestReportDateStr);

    let start = todayDate;
    const end = todayDate;

    if (range === '7d') {
      const rangeStart = subDays(todayDate, 6);
      // Start from the rangeStart, or if reports started later, start from the earliest report
      start = earliestReportDate > rangeStart ? earliestReportDate : rangeStart;
    } else if (range === '30d') {
      const rangeStart = subDays(todayDate, 29);
      start = earliestReportDate > rangeStart ? earliestReportDate : rangeStart;
    } else {
      // All time
      start = earliestReportDate;
    }

    const interval = eachDayOfInterval({ start, end });

    return interval.map((dateObj) => {
      const dateStr = getLocalDateString(dateObj);
      const reportData = reportsMap.get(dateStr);
      const isMissing = !reportsMap.has(dateStr);
      
      return {
        date: dateStr,
        displayDate: format(dateObj, 'MMM d'),
        score: isMissing ? 50 : (reportData?.score as number),
        isMissing,
        preview: reportData?.preview || 'No highlights logged.',
        isToday: dateStr === todayStr,
      };
    });
  };

  const chartData = generateChartData();
  const todayStr = getLocalDateString();
  const hasReports = reports && reports.filter((r) => r.date <= todayStr).length > 0;

  const handlePointClick = (state: any) => {
    if (state && state.activePayload && state.activePayload.length > 0) {
      const clickedDate = state.activePayload[0].payload.date;
      setSelectedDate(clickedDate);
    }
  };



  return (
    <div className="bg-bg-card border border-border-soft rounded-card shadow-card p-6 flex flex-col gap-6 select-none transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <IconContainer icon={TrendingUp} variant="purple" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-text-primary">Performance Trend</h2>
              <StreakBadge />
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              Visualizing daily self-tracking metrics over time.
            </p>
          </div>
        </div>

        {/* Range Selector Tabs */}
        <div className="flex bg-bg-secondary border border-border-soft/60 rounded-xl p-1 self-start sm:self-auto shadow-inner">
          {(['7d', '30d', 'all'] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                range === r
                  ? 'bg-bg-card text-text-primary shadow-sm border border-border-soft/40'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* Graph rendering */}
      <div className="w-full h-[220px]">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-accent-purple animate-spin" />
          </div>
        ) : !hasReports ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-center gap-1.5 border border-dashed border-border-soft rounded-xl bg-bg-secondary/20">
            <Calendar className="w-8 h-8 text-text-muted" />
            <span className="text-xs font-semibold text-text-secondary">Start logging your days to see trends</span>
            <span className="text-[10px] text-text-muted">A flat line at 50 is displayed when data is empty.</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              onClick={handlePointClick}
              margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              
              <CartesianGrid
                vertical={false}
                stroke="#E7E5EA"
                strokeWidth={0.5}
                strokeDasharray="3 3"
              />
              
              <XAxis
                dataKey="displayDate"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 500 }}
                dy={8}
              />
              
              <YAxis
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 500 }}
                dx={-8}
              />
              
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#E7E5EA', strokeWidth: 1 }} />
              
              <Area
                type="monotone"
                dataKey="score"
                stroke="#3B82F6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorScore)"
                activeDot={(dotProps: any) => {
                  const { cx, cy, payload } = dotProps;
                  const dotColor = payload.isToday ? '#A855F7' : '#3B82F6';
                  const dotRadius = payload.isToday ? 7 : 5;
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={dotRadius}
                      fill={dotColor}
                      stroke="#FFFFFF"
                      strokeWidth={2}
                      className="cursor-pointer shadow-sm hover:scale-125 transition-transform"
                    />
                  );
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
