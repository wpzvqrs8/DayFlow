'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, Loader2, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function LockScreen() {
  const { setIsAuthenticated } = useApp();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  
  // Rate limiting states
  const [cooldown, setCooldown] = useState(0);

  // Password strength states (only for setup)
  const [strength, setStrength] = useState({ score: 0, text: 'Very Weak', color: 'bg-accent-red' });

  // 1. Check if setup is needed on mount
  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const res = await fetch('/api/auth/verify');
        const data = await res.json();
        setNeedsSetup(data.needsSetup);
      } catch (err) {
        setNeedsSetup(true); // Default to setup mode if error occurs
      }
    };
    checkSetupStatus();
  }, []);

  // 2. Cooldown timer countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // 3. Track password strength for setup mode
  useEffect(() => {
    if (!password) {
      setStrength({ score: 0, text: 'Empty', color: 'bg-text-muted' });
      return;
    }
    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    let text = 'Very Weak';
    let color = 'bg-accent-red';

    if (score >= 4) {
      text = 'Strong';
      color = 'bg-accent-green';
    } else if (score >= 2) {
      text = 'Medium';
      color = 'bg-accent-orange';
    }

    setStrength({ score, text, color });
  }, [password]);

  // 4. Handle Unlock/Setup submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0 || loading) return;

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          isSetup: needsSetup
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setLoading(false);
        setPassword('');
        // Trigger shake animation
        setShake(true);
        setTimeout(() => setShake(false), 400);

        if (res.status === 429) {
          setCooldown(data.cooldown || 60);
          setError(data.error);
        } else {
          setError(data.error || 'Authentication failed');
        }
        return;
      }

      // Successful auth
      setIsAuthenticated(true);
      if (needsSetup) {
        setNeedsSetup(false);
      }
    } catch (err) {
      setLoading(false);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  if (needsSetup === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <Loader2 className="w-8 h-8 text-accent-purple animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 animated-bg">
      <div
        className={`w-full max-w-[420px] bg-bg-card border border-border-soft rounded-card-lg shadow-card p-6 transition-all duration-300 ${
          shake ? 'animate-shake' : ''
        }`}
      >
        {/* Header Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-[rgba(168,85,247,0.1)] flex items-center justify-center text-accent-purple">
            {needsSetup ? <ShieldCheck className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
            {needsSetup ? 'Create Your Password' : 'Welcome Back'}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {needsSetup
              ? 'Set a private master password for DayFlow'
              : 'Enter your password to access DayFlow'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={needsSetup ? 'Create password (min 8 chars)' : 'Password'}
              disabled={cooldown > 0 || loading}
              className="w-full bg-bg-card border border-border-soft focus:border-accent-blue focus:ring-2 focus:ring-[rgba(59,130,246,0.15)] rounded-xl py-3 pl-4 pr-12 text-sm outline-none transition-all placeholder:text-text-muted text-text-primary disabled:opacity-60"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={cooldown > 0 || loading}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors disabled:opacity-40"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Strength Indicator (Setup only) */}
          {needsSetup && password.length > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-secondary">Password Strength:</span>
                <span className="font-medium text-text-primary">{strength.text}</span>
              </div>
              <div className="h-1.5 w-full bg-border-soft rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${strength.color}`}
                  style={{ width: `${(strength.score / 5) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 text-xs text-accent-red bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.15)] rounded-lg p-3">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={cooldown > 0 || loading || (needsSetup && password.length < 8)}
            className="w-full flex items-center justify-center gap-2 bg-accent-blue hover:bg-blue-600 disabled:bg-text-muted text-white font-medium py-3 px-4 rounded-xl text-sm transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed hover:shadow-md"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : needsSetup ? (
              'Set Password & Complete Setup'
            ) : cooldown > 0 ? (
              `Locked (${cooldown}s)`
            ) : (
              'Unlock DayFlow'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center mt-8 pt-4 border-t border-border-soft/60">
          <span className="text-xs text-text-muted italic">Personal. Private. Yours.</span>
        </div>
      </div>
    </div>
  );
}
