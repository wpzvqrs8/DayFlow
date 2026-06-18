import useSWR from 'swr';
import { DailyReport } from '@/types';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch daily report');
  return res.json();
};

export function useDailyReport(date: string) {
  const { data, error, isLoading, mutate } = useSWR<DailyReport>(
    date ? `/api/reports/${date}` : null,
    fetcher
  );

  const updateReport = async (payload: Partial<DailyReport>) => {
    if (!date) return;

    // Optimistic UI update
    const optimisticData = data
      ? { ...data, ...payload }
      : ({ date, score: 50, accomplishments: '', challenges: '', reflections: '', ...payload } as DailyReport);

    mutate(optimisticData, false);

    try {
      const res = await fetch(`/api/reports/${date}`, {
        method: 'POST', // handles upsert
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(optimisticData),
      });

      if (!res.ok) throw new Error('Failed to save report');
      
      const updatedReport = await res.json();
      mutate(updatedReport, true);
      return updatedReport;
    } catch (err) {
      // Revert cache on failure
      mutate();
      throw err;
    }
  };

  return {
    report: data,
    isLoading,
    isError: error,
    updateReport,
  };
}
