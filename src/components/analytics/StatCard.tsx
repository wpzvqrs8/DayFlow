import React from 'react';
import { LucideIcon } from 'lucide-react';
import IconContainer from '../shared/IconContainer';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: React.ReactNode;
  variant?: 'blue' | 'purple' | 'green' | 'orange' | 'red';
  className?: string;
}

export default function StatCard({
  title,
  value,
  icon,
  description,
  variant = 'blue',
  className
}: StatCardProps) {
  return (
    <div
      className={cn(
        'bg-bg-card border border-border-soft rounded-card shadow-card p-6 flex flex-col gap-4 select-none transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{title}</span>
        <IconContainer icon={icon} variant={variant} />
      </div>
      
      <div className="flex flex-col gap-1">
        <span className="text-3xl font-bold text-text-primary tracking-tight">{value}</span>
        {description && (
          <div className="text-xs text-text-secondary flex items-center gap-1">
            {description}
          </div>
        )}
      </div>
    </div>
  );
}
