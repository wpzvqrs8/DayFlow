'use client';

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { Loader2, Calendar } from 'lucide-react';

interface WeeklyTrendProps {
  data: {
    date: string;
    dayName: string;
    score: number;
  }[];
  averageScore: number;
}

export default function WeeklyTrend({ data, averageScore }: WeeklyTrendProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full h-full flex items-center justify-center min-h-[220px]">
        <Loader2 className="w-6 h-6 text-accent-blue animate-spin" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center text-xs text-text-muted min-h-[220px]">
        <Calendar className="w-8 h-8 text-text-muted mb-1.5" />
        <span>No trend data available.</span>
      </div>
    );
  }

  // Custom Tooltip Component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      const item = payload[0].payload;
      return (
        <div className="bg-bg-card border border-border-soft shadow-lg rounded-xl p-2.5 text-xs select-none">
          <div className="font-semibold text-text-primary mb-0.5">{item.dayName} ({item.date})</div>
          <div>
            <span className="text-text-secondary">Score: </span>
            <span className="font-bold text-accent-blue">{item.score}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full min-h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#E7E5EA" strokeWidth={0.5} strokeDasharray="3 3" />
          <XAxis
            dataKey="dayName"
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
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8F7FA', opacity: 0.8 }} />
          
          {/* Average Line */}
          {averageScore > 0 && (
            <ReferenceLine
              y={averageScore}
              stroke="#A855F7"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `Avg: ${averageScore}`,
                position: 'top',
                fill: '#A855F7',
                fontSize: 9,
                fontWeight: 600
              }}
            />
          )}

          <Bar
            dataKey="score"
            fill="#3B82F6"
            radius={[6, 6, 0, 0]}
            maxBarSize={32}
            className="transition-colors hover:fill-blue-600 duration-200"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
