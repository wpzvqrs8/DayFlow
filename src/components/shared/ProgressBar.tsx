import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max: number;
  variant?: 'green' | 'blue' | 'purple';
  className?: string;
}

export default function ProgressBar({
  value,
  max,
  variant = 'green',
  className
}: ProgressBarProps) {
  const percentage = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  const progressColors = {
    green: 'bg-accent-green',
    blue: 'bg-accent-blue',
    purple: 'bg-accent-purple',
  };

  return (
    <div className={cn('w-full h-1 bg-bg-secondary rounded-full overflow-hidden border border-border-soft/20', className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-500 ease-out', progressColors[variant])}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
