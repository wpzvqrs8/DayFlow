'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import LockScreen from '@/components/auth/LockScreen';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const { isAuthenticated, isLoading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary select-none">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-accent-purple animate-spin" />
          <span className="text-xs text-text-secondary font-semibold">Initializing DayFlow...</span>
        </div>
      </div>
    );
  }

  // If authenticated, we will redirect via useEffect, but render nothing in the meantime
  if (isAuthenticated) {
    return null;
  }

  return <LockScreen />;
}
