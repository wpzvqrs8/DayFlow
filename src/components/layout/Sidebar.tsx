'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Calendar, BarChart3, Settings, Lock, User } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { setIsAuthenticated } = useApp();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleLock = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        setIsAuthenticated(false);
        router.push('/');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <aside className="w-[240px] h-screen bg-bg-card border-r border-border-soft flex flex-col fixed left-0 top-0 z-20">
      {/* Brand Logo & Wordmark */}
      <div className="p-6 border-b border-border-soft/60">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[rgba(168,85,247,0.1)] flex items-center justify-center text-accent-purple font-bold text-lg">
            D
          </div>
          <span className="font-semibold text-lg text-text-primary tracking-tight">DayFlow</span>
        </Link>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-accent-blue/10 text-accent-blue'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-accent-blue' : 'text-text-secondary'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info & Lock Panel */}
      <div className="p-4 border-t border-border-soft/60 bg-bg-secondary/40 space-y-3">
        <div className="flex items-center justify-between px-3 py-2 bg-bg-card border border-border-soft/80 rounded-xl">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-accent-blue/10 flex items-center justify-center text-accent-blue">
              <User className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold text-text-primary">Owner</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-accent-green" />
            <span className="text-[10px] font-medium text-text-secondary">Online</span>
          </div>
        </div>

        <button
          onClick={handleLock}
          className="w-full flex items-center justify-center gap-2 bg-bg-card hover:bg-accent-red/5 border border-border-soft hover:border-accent-red/20 text-text-secondary hover:text-accent-red text-xs font-medium py-2.5 px-4 rounded-xl transition-all cursor-pointer"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Lock Workspace</span>
        </button>
      </div>
    </aside>
  );
}
