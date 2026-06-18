import React, { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AutoSaveIndicatorProps {
  status: 'idle' | 'saving' | 'saved';
  className?: string;
}

export default function AutoSaveIndicator({ status, className }: AutoSaveIndicatorProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (status === 'saving' || status === 'saved') {
      setVisible(true);
    }
    
    if (status === 'saved') {
      const timer = setTimeout(() => {
        setVisible(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  if (!visible || status === 'idle') return null;

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 text-xs transition-all duration-300 ease-out select-none',
        status === 'saving' ? 'text-text-muted animate-pulse' : 'text-accent-green',
        className
      )}
    >
      {status === 'saving' ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Saving...</span>
        </>
      ) : (
        <>
          <Check className="w-3.5 h-3.5 shrink-0" />
          <span>Saved</span>
        </>
      )}
    </div>
  );
}
