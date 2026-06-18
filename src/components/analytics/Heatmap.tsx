'use client';

import React from 'react';
import { format, parseISO, getDay } from 'date-fns';
import { cn } from '@/lib/utils';

interface HeatmapProps {
  data: {
    date: string;
    score: number;
  }[];
}

export default function Heatmap({ data }: HeatmapProps) {
  if (!data || data.length === 0) {
    return <div className="text-center py-10 text-xs text-text-muted">No heatmap data available.</div>;
  }

  // 1. Get the first day-of-week index (0 for Sunday, 6 for Saturday)
  const firstDate = parseISO(data[0].date);
  const firstDayOfWeek = getDay(firstDate);

  // 2. Create padding squares for the starting week
  const paddingSquares = Array.from({ length: firstDayOfWeek });

  // 3. Helper to resolve score to Tailwind opacity values in v4 style
  const getColorClass = (score: number) => {
    if (score >= 80) return 'bg-accent-blue hover:scale-110';
    if (score >= 60) return 'bg-accent-blue/70 hover:scale-110';
    if (score >= 40) return 'bg-accent-blue/40 hover:scale-110';
    return 'bg-accent-blue/20 hover:scale-110';
  };

  const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="flex flex-col gap-4 select-none">
      {/* Legend & Layout Grid */}
      <div className="flex items-start gap-3 overflow-x-auto pb-2 scrollbar-none">
        {/* Y Axis Labels (Sun, Tue, Thu, Sat) */}
        <div className="grid grid-rows-7 gap-[7px] text-[9px] font-bold text-text-muted h-[105px] pt-1.5 shrink-0 uppercase select-none w-4">
          <span>S</span>
          <span></span>
          <span>T</span>
          <span></span>
          <span>T</span>
          <span></span>
          <span>S</span>
        </div>

        {/* Grid Area */}
        <div className="grid grid-flow-col grid-rows-7 gap-[7.5px] h-[105px] pt-1 shrink-0">
          {/* Padding */}
          {paddingSquares.map((_, i) => (
            <div key={`pad-${i}`} className="w-[11px] h-[11px] bg-transparent" />
          ))}

          {/* Actual Squares */}
          {data.map((day) => {
            const parsedDate = parseISO(day.date);
            const displayDateStr = format(parsedDate, 'MMM d, yyyy');
            const colorClass = getColorClass(day.score);

            return (
              <div key={day.date} className="relative group/square">
                <div
                  className={cn(
                    'w-[11px] h-[11px] rounded-[3px] transition-all duration-200 cursor-pointer shadow-sm',
                    colorClass
                  )}
                />
                
                {/* Hover Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/square:block bg-text-primary text-white text-[10px] font-semibold py-1 px-2 rounded-lg shadow-md whitespace-nowrap z-30 transition-all pointer-events-none">
                  {displayDateStr}: <span className="text-accent-blue font-bold">{day.score}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend Scale */}
      <div className="flex items-center justify-between text-[10px] text-text-muted font-bold uppercase tracking-wider border-t border-border-soft/40 pt-3 select-none">
        <span>Less consistent</span>
        <div className="flex items-center gap-1 font-normal">
          <div className="w-[9px] h-[9px] rounded-[2.5px] bg-accent-blue/20" />
          <div className="w-[9px] h-[9px] rounded-[2.5px] bg-accent-blue/40" />
          <div className="w-[9px] h-[9px] rounded-[2.5px] bg-accent-blue/70" />
          <div className="w-[9px] h-[9px] rounded-[2.5px] bg-accent-blue" />
          <span className="text-text-muted font-bold ml-1">More consistent</span>
        </div>
      </div>
    </div>
  );
}
