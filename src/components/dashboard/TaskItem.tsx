'use client';

import React from 'react';
import { Check, Trash2, Clock } from 'lucide-react';
import { Task } from '@/types';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string, is_completed: boolean) => void;
  onDelete: (id: string) => void;
}

export default function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  const formattedCompletionTime = task.is_completed && task.completed_at
    ? format(parseISO(task.completed_at), 'h:mm a')
    : null;

  return (
    <div className="group flex items-center justify-between py-3 px-4 rounded-xl hover:bg-bg-secondary transition-all duration-200 select-none">
      {/* Checkbox and Title */}
      <div className="flex items-center gap-3.5 flex-1 min-w-0">
        {/* Custom Checkbox */}
        <button
          onClick={() => onToggle(task.id, !task.is_completed)}
          className={cn(
            'w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-sm',
            task.is_completed
              ? 'bg-accent-green border-accent-green text-white animate-bounce-check'
              : 'bg-bg-card border-border-soft hover:border-text-muted text-transparent'
          )}
        >
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        </button>

        {/* Title & Timestamp */}
        <div className="flex flex-col min-w-0 leading-tight">
          <span
            className={cn(
              'text-sm transition-all',
              task.is_completed
                ? 'line-through text-text-muted font-medium'
                : 'text-text-primary font-medium'
            )}
          >
            {task.title}
          </span>
          {task.is_completed && formattedCompletionTime && (
            <span className="text-[10px] text-text-muted flex items-center gap-1 mt-0.5">
              <Clock className="w-2.5 h-2.5" />
              <span>Completed at {formattedCompletionTime}</span>
            </span>
          )}
        </div>
      </div>

      {/* Delete Trigger (custom tasks only) */}
      {!task.is_default && (
        <button
          onClick={() => onDelete(task.id)}
          className="w-8 h-8 rounded-lg text-text-muted hover:text-accent-red hover:bg-accent-red/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
          title="Delete Task"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
