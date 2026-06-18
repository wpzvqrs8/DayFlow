'use client';

import React from 'react';
import useSWR from 'swr';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface StreakBadgeProps {
  className?: string;
}

export default function StreakBadge({ className }: StreakBadgeProps) {
  const { data, error } = useSWR('/api/analytics', fetcher);

  const streak = data?.streak ?? 0;

  if (error || streak === 0) return null;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 bg-accent-orange/10 border border-accent-orange/15 text-accent-orange text-[10px] sm:text-xs font-semibold py-1 px-2.5 rounded-full select-none shadow-sm animate-pulse-subtle',
        className
      )}
    >
      <Flame className="w-3.5 h-3.5 fill-accent-orange animate-bounce-subtle" />
      <span>{streak} Day Streak</span>
    </div>
  );
}
