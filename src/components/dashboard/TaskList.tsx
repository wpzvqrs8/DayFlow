'use client';

import React, { useState } from 'react';
import { Plus, ListTodo, Loader2 } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import TaskItem from './TaskItem';
import ProgressBar from '../shared/ProgressBar';
import IconContainer from '../shared/IconContainer';

interface TaskListProps {
  date: string;
}

export default function TaskList({ date }: TaskListProps) {
  const { tasks, isLoading, addTask, toggleTask, deleteTask } = useTasks(date);
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);

  const defaultTasks = tasks.filter((t) => t.is_default);
  const customTasks = tasks.filter((t) => !t.is_default);

  const completedCount = tasks.filter((t) => t.is_completed).length;
  const totalCount = tasks.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || adding) return;

    setAdding(true);
    try {
      await addTask(newTitle.trim());
      setNewTitle('');
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="bg-bg-card border border-border-soft rounded-card shadow-card p-6 flex flex-col gap-5 select-none transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <IconContainer icon={ListTodo} variant="blue" />
            <div>
              <h2 className="text-base font-semibold text-text-primary">Today's Tasks</h2>
              <p className="text-xs text-text-secondary mt-0.5">Focus on what matters today.</p>
            </div>
          </div>
          
          {totalCount > 0 && (
            <span className="text-xs font-semibold text-accent-green bg-accent-green/10 py-1 px-2.5 rounded-full select-none">
              {completedCount} / {totalCount} done
            </span>
          )}
        </div>

        {/* Progress Bar */}
        {totalCount > 0 && (
          <ProgressBar value={completedCount} max={totalCount} variant="green" />
        )}
      </div>

      {/* Task Sections */}
      <div className="flex-1 space-y-4">
        {isLoading ? (
          <div className="h-full flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 text-accent-blue animate-spin" />
          </div>
        ) : totalCount === 0 ? (
          <div className="text-center py-10 text-xs text-text-muted">No tasks available for this date.</div>
        ) : (
          <>
            {/* Default Tasks */}
            {defaultTasks.length > 0 && (
              <div className="space-y-1">
                <h3 className="text-[10px] uppercase tracking-wider font-bold text-text-muted px-4 mb-1">
                  Routine Tasks
                </h3>
                <div className="space-y-0.5">
                  {defaultTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={toggleTask}
                      onDelete={deleteTask}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Separator if both exist */}
            {defaultTasks.length > 0 && customTasks.length > 0 && (
              <div className="border-t border-border-soft/60 my-2" />
            )}

            {/* Custom Tasks */}
            {customTasks.length > 0 && (
              <div className="space-y-1">
                <h3 className="text-[10px] uppercase tracking-wider font-bold text-text-muted px-4 mb-1">
                  Custom Tasks
                </h3>
                <div className="space-y-0.5">
                  {customTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={toggleTask}
                      onDelete={deleteTask}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Task Input Form */}
      <form onSubmit={handleSubmit} className="relative mt-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a custom task..."
          disabled={adding}
          className="w-full bg-bg-secondary border border-border-soft/60 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/15 rounded-xl py-2.5 pl-4 pr-12 text-sm outline-none transition-all placeholder:text-text-muted text-text-primary disabled:opacity-60 font-medium"
        />
        <button
          type="submit"
          disabled={!newTitle.trim() || adding}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-accent-blue text-white flex items-center justify-center transition-all disabled:bg-text-muted/20 disabled:text-text-muted cursor-pointer disabled:cursor-not-allowed hover:bg-blue-600 shadow-sm"
        >
          {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}
