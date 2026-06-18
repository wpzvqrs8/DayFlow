import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Maps a numeric daily score (0-100) to corresponding Tailwind color variables or classes
 */
export function getScoreColor(score: number): {
  color: string;
  bg: string;
  border: string;
  text: string;
} {
  if (score >= 80) {
    return {
      color: '#22C55E', // Green
      bg: 'bg-[rgba(34,197,94,0.1)]',
      border: 'border-accent-green',
      text: 'text-accent-green',
    };
  }
  if (score >= 60) {
    return {
      color: '#3B82F6', // Blue
      bg: 'bg-[rgba(59,130,246,0.1)]',
      border: 'border-accent-blue',
      text: 'text-accent-blue',
    };
  }
  if (score >= 40) {
    return {
      color: '#F59E0B', // Orange
      bg: 'bg-[rgba(245,158,11,0.1)]',
      border: 'border-accent-orange',
      text: 'text-accent-orange',
    };
  }
  return {
    color: '#EF4444', // Red
    bg: 'bg-[rgba(239,68,68,0.1)]',
    border: 'border-accent-red',
    text: 'text-accent-red',
  };
}

/**
 * Format date string (YYYY-MM-DD) into display format (e.g. Thursday, June 19, 2026)
 */
export function formatDisplayDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'EEEE, MMMM d, yyyy');
  } catch (e) {
    return dateStr;
  }
}

/**
 * Returns today's date in YYYY-MM-DD format in local timezone
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Debounce helper for auto-saving
 */
export function debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
