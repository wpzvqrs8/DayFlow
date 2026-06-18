'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import Sidebar from './Sidebar';
import { LayoutDashboard, Calendar as CalendarIcon, BarChart3, Settings, Bell, Clock, Menu } from 'lucide-react';
import { getLocalDateString, formatDisplayDate } from '@/lib/utils';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { selectedDate, setSelectedDate } = useApp();
  const [greeting, setGreeting] = useState('Welcome');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sessionTimeLeft, setSessionTimeLeft] = useState('24:00');

  // 1. Calculate Greeting based on local time
  useEffect(() => {
    const hours = new Date().getHours();
    if (hours < 12) {
      setGreeting('Good morning ☀️');
    } else if (hours < 17) {
      setGreeting('Good afternoon 🌤️');
    } else if (hours < 21) {
      setGreeting('Good evening 🌅');
    } else {
      setGreeting('Good night 🌙');
    }

    // 2. Simple session remaining calculator (stub representing 24h JWT countdown)
    const calculateSessionTime = () => {
      // Mock remaining time based on cookie setup (resets to 24h at load, countdown for display)
      const mockExpiry = sessionStorage.getItem('mock_session_expiry');
      let expiryTime = Number(mockExpiry);
      
      if (!mockExpiry || isNaN(expiryTime)) {
        expiryTime = Date.now() + 24 * 60 * 60 * 1000;
        sessionStorage.setItem('mock_session_expiry', expiryTime.toString());
      }
      
      const diff = expiryTime - Date.now();
      if (diff <= 0) {
        setSessionTimeLeft('0:00');
        return;
      }
      
      const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
      const minsLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setSessionTimeLeft(`${hoursLeft}h ${minsLeft}m`);
    };

    calculateSessionTime();
    const interval = setInterval(calculateSessionTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleJumpToToday = () => {
    setSelectedDate(getLocalDateString());
  };

  const mobileNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Calendar', path: '/calendar', icon: CalendarIcon },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-bg-primary">
      {/* 1. Desktop Sidebar (Hidden on mobile) */}
      <div className="hidden sm:block">
        <Sidebar />
      </div>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col sm:pl-[240px] pb-20 sm:pb-0 min-h-screen overflow-x-hidden">
        {/* Sticky Top Bar */}
        <header className="sticky top-0 bg-bg-primary/95 backdrop-blur-md border-b border-border-soft/60 h-16 flex items-center justify-between px-4 sm:px-8 z-10">
          {/* Left: Greeting & Date */}
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
              {greeting}
            </span>
            <span className="text-[11px] text-text-secondary font-medium">
              {formatDisplayDate(selectedDate || getLocalDateString())}
            </span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {selectedDate !== getLocalDateString() && (
              <button
                onClick={handleJumpToToday}
                className="bg-bg-card hover:bg-bg-secondary border border-border-soft hover:border-text-secondary/20 text-text-primary text-xs font-semibold py-1.5 px-3 rounded-lg transition-all shadow-sm flex items-center gap-1 cursor-pointer"
              >
                Today
              </button>
            )}

            {/* Session Expiry Bell */}
            <div className="group relative">
              <button className="w-8 h-8 rounded-lg bg-bg-card border border-border-soft hover:bg-bg-secondary flex items-center justify-center text-text-secondary hover:text-text-primary transition-all relative">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-accent-purple rounded-full" />
              </button>
              
              {/* Tooltip */}
              <div className="absolute right-0 mt-2 w-48 bg-bg-card border border-border-soft shadow-lg rounded-xl p-3 text-xs text-text-secondary hidden group-hover:block z-30 transition-all duration-200">
                <div className="flex items-center gap-1.5 font-semibold text-text-primary mb-1">
                  <Clock className="w-3.5 h-3.5 text-accent-purple" />
                  <span>Session Remaining</span>
                </div>
                <p>Your session expires in <span className="font-semibold text-accent-purple">{sessionTimeLeft}</span>. Lock the workspace anytime from the sidebar.</p>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Page Wrapper with Transition */}
        <main key={pathname} className="flex-1 p-4 sm:p-8 max-w-[1280px] w-full mx-auto page-transition">
          {children}
        </main>
      </div>

      {/* 3. Mobile Bottom Navigation Bar (Hidden on desktop) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 h-16 bg-bg-card border-t border-border-soft flex items-center justify-around z-20 px-2 shadow-lg">
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all ${
                isActive ? 'text-accent-blue font-medium' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
