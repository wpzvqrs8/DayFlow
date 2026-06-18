import useSWR from 'swr';
import { Task } from '@/types';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch tasks');
  return res.json();
};

export function useTasks(date: string) {
  const { data, error, isLoading, mutate } = useSWR<Task[]>(
    date ? `/api/tasks?date=${date}` : null,
    fetcher
  );

  // Add a task
  const addTask = async (title: string) => {
    if (!date) return;

    // Temporary task for optimistic update
    const tempId = `temp-${Date.now()}`;
    const newTask: Task = {
      id: tempId,
      title,
      is_default: false,
      date,
      is_completed: false,
      completed_at: null,
      created_at: new Date().toISOString()
    };

    const optimisticTasks = data ? [...data, newTask] : [newTask];
    mutate(optimisticTasks, false);

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, date }),
      });

      if (!res.ok) throw new Error('Failed to create task');
      
      const createdTask = await res.json();
      
      // Replace temp task with actual task from backend
      mutate(
        data
          ? [...data.filter(t => t.id !== tempId), createdTask]
          : [createdTask],
        true
      );
    } catch (err) {
      mutate(); // Rollback
      throw err;
    }
  };

  // Toggle task completion
  const toggleTask = async (id: string, is_completed: boolean) => {
    if (!data) return;

    const completed_at = is_completed ? new Date().toISOString() : null;
    const optimisticTasks = data.map(t =>
      t.id === id ? { ...t, is_completed, completed_at } : t
    );

    mutate(optimisticTasks, false);

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed }),
      });

      if (!res.ok) throw new Error('Failed to update task');
      
      const updatedTask = await res.json();
      mutate(
        data.map(t => (t.id === id ? updatedTask : t)),
        true
      );
    } catch (err) {
      mutate(); // Rollback
      throw err;
    }
  };

  // Delete a task
  const deleteTask = async (id: string) => {
    if (!data) return;

    const optimisticTasks = data.filter(t => t.id !== id);
    mutate(optimisticTasks, false);

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete task');
      
      mutate(optimisticTasks, true);
    } catch (err) {
      mutate(); // Rollback
      throw err;
    }
  };

  return {
    tasks: data || [],
    isLoading,
    isError: error,
    addTask,
    toggleTask,
    deleteTask,
  };
}
