import useSWR from 'swr';
import { useState } from 'react';
import { DailyNote } from '@/types';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch note');
  return res.json();
};

export function useNotes(date: string) {
  const { data, error, isLoading, mutate } = useSWR<DailyNote>(
    date ? `/api/notes/${date}` : null,
    fetcher
  );
  
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const saveNote = async (content: string) => {
    if (!date) return;

    setSaveStatus('saving');
    
    // Update local cache optimistically
    const optimisticData = data
      ? { ...data, content }
      : ({ date, content } as DailyNote);
      
    mutate(optimisticData, false);

    try {
      const res = await fetch(`/api/notes/${date}`, {
        method: 'POST', // handles upsert
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) throw new Error('Failed to save note');
      
      const updatedNote = await res.json();
      mutate(updatedNote, true);
      setSaveStatus('saved');
      
      // Reset status to idle after a small delay
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
      
      return updatedNote;
    } catch (err) {
      setSaveStatus('idle');
      mutate(); // Rollback cache
      throw err;
    }
  };

  return {
    note: data,
    isLoading,
    isError: error,
    saveNote,
    saveStatus,
    setSaveStatus
  };
}
