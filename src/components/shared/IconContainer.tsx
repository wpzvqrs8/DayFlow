import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IconContainerProps {
  icon: LucideIcon;
  variant?: 'blue' | 'purple' | 'green' | 'orange' | 'red';
  className?: string;
}

export default function IconContainer({
  icon: Icon,
  variant = 'blue',
  className
}: IconContainerProps) {
  const variantStyles = {
    blue: 'bg-accent-blue/10 text-accent-blue',
    purple: 'bg-accent-purple/10 text-accent-purple',
    green: 'bg-accent-green/10 text-accent-green',
    orange: 'bg-accent-orange/10 text-accent-orange',
    red: 'bg-accent-red/10 text-accent-red',
  };

  return (
    <div
      className={cn(
        'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 select-none transition-colors duration-300',
        variantStyles[variant],
        className
      )}
    >
      <Icon className="w-5 h-5" />
    </div>
  );
}
