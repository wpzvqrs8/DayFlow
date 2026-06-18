'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import {
  Settings,
  Lock,
  Download,
  AlertTriangle,
  Plus,
  Trash2,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  ListTodo
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import IconContainer from '@/components/shared/IconContainer';
import { useApp } from '@/context/AppContext';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SettingsPage() {
  const router = useRouter();
  const { setIsAuthenticated } = useApp();
  
  // 1. Fetch user-configured default tasks
  const { data: defaultsData, mutate: mutateDefaults } = useSWR('/api/settings/default-tasks', fetcher);
  const [defaultTasks, setDefaultTasks] = useState<string[]>([]);
  const [newDefaultTitle, setNewDefaultTitle] = useState('');
  const [savingDefaults, setSavingDefaults] = useState(false);

  // 2. Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // 3. Data management state
  const [lastExport, setLastExport] = useState<string>('Never');
  const [isExporting, setIsExporting] = useState(false);

  // 4. Clear data modal
  const [showClearModal, setShowClearModal] = useState(false);
  const [confirmDeleteText, setConfirmDeleteText] = useState('');
  const [clearingData, setClearingData] = useState(false);
  const [clearError, setClearError] = useState('');

  // 5. Session timer
  const [sessionExpiry, setSessionExpiry] = useState<string>('Loading...');

  // Sync defaultTasks list when loaded
  useEffect(() => {
    if (defaultsData?.defaultTasks) {
      setDefaultTasks(defaultsData.defaultTasks);
    }
  }, [defaultsData]);

  // Load last export date from local storage
  useEffect(() => {
    const stored = localStorage.getItem('dayflow_last_export');
    if (stored) setLastExport(stored);

    // Calculate expiry string
    const mockExpiry = sessionStorage.getItem('mock_session_expiry');
    if (mockExpiry) {
      const remaining = Number(mockExpiry) - Date.now();
      if (remaining > 0) {
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        setSessionExpiry(`Expires in ${hours}h ${minutes}m`);
      } else {
        setSessionExpiry('Expired');
      }
    } else {
      setSessionExpiry('24 hours from login');
    }
  }, []);

  // -- SECURITY SECTION: CHANGE PASSWORD --
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordStatus({ type: 'error', message: 'Password must be at least 8 characters long.' });
      return;
    }

    setUpdatingPassword(true);

    try {
      const res = await fetch('/api/settings/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPasswordStatus({ type: 'error', message: data.error || 'Failed to update password.' });
      } else {
        setPasswordStatus({ type: 'success', message: 'Password changed successfully.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch {
      setPasswordStatus({ type: 'error', message: 'A network error occurred.' });
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleLockNow = async () => {
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

  // -- PREFERENCES SECTION: DEFAULT TASKS --
  const handleAddDefaultTask = () => {
    const title = newDefaultTitle.trim();
    if (!title || defaultTasks.includes(title)) return;
    setDefaultTasks([...defaultTasks, title]);
    setNewDefaultTitle('');
  };

  const handleDeleteDefaultTask = (titleToDelete: string) => {
    setDefaultTasks(defaultTasks.filter((t) => t !== titleToDelete));
  };

  const handleSaveDefaultTasks = async () => {
    if (defaultTasks.length === 0) return;
    setSavingDefaults(true);

    try {
      const res = await fetch('/api/settings/default-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultTasks }),
      });

      if (res.ok) {
        mutateDefaults();
        alert('Default tasks saved successfully!');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save default tasks.');
      }
    } catch {
      alert('Failed to save default tasks.');
    } finally {
      setSavingDefaults(false);
    }
  };

  // -- DATA MANAGEMENT: EXPORT --
  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/export');
      if (!response.ok) throw new Error();
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dayflow_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      
      const timeStr = new Date().toLocaleString();
      localStorage.setItem('dayflow_last_export', timeStr);
      setLastExport(timeStr);
    } catch {
      alert('Failed to export data.');
    } finally {
      setIsExporting(false);
    }
  };

  // -- DATA MANAGEMENT: CLEAR ALL DATA --
  const handleClearData = async () => {
    if (confirmDeleteText !== 'DELETE') {
      setClearError('Please type "DELETE" exactly.');
      return;
    }

    setClearingData(true);
    setClearError('');

    try {
      const res = await fetch('/api/settings/clear-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: 'DELETE' }),
      });

      if (res.ok) {
        alert('Workspace successfully cleared!');
        setShowClearModal(false);
        setConfirmDeleteText('');
        router.refresh();
      } else {
        const data = await res.json();
        setClearError(data.error || 'Failed to delete workspace.');
      }
    } catch {
      setClearError('A network error occurred.');
    } finally {
      setClearingData(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-10">
        {/* Page Header */}
        <div className="flex items-center gap-3 select-none">
          <IconContainer icon={Settings} variant="blue" />
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-text-primary tracking-tight">App Settings</h1>
            <p className="text-xs text-text-secondary mt-0.5">Manage preferences, security master keys, and your data.</p>
          </div>
        </div>

        {/* 1. Security & Keys Section */}
        <div className="bg-bg-card border border-border-soft rounded-card shadow-card p-6 flex flex-col gap-5 hover:shadow-card-hover transition-all duration-300">
          <div className="flex items-center gap-2 border-b border-border-soft/60 pb-3">
            <Lock className="w-5 h-5 text-accent-purple" />
            <h2 className="text-base font-semibold text-text-primary">Security & Session</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Password Change Form */}
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Change Password</h3>

              <div className="space-y-3">
                {/* Current */}
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Current Password"
                    required
                    className="w-full bg-bg-secondary border border-border-soft/60 focus:border-accent-purple focus:ring-2 focus:ring-accent-purple/10 rounded-xl py-2 px-3 text-xs outline-none transition-all placeholder:text-text-muted"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"
                  >
                    {showCurrent ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* New */}
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New Password (min 8 chars)"
                    required
                    className="w-full bg-bg-secondary border border-border-soft/60 focus:border-accent-purple focus:ring-2 focus:ring-accent-purple/10 rounded-xl py-2 px-3 text-xs outline-none transition-all placeholder:text-text-muted"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"
                  >
                    {showNew ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Confirm */}
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm New Password"
                    required
                    className="w-full bg-bg-secondary border border-border-soft/60 focus:border-accent-purple focus:ring-2 focus:ring-accent-purple/10 rounded-xl py-2 px-3 text-xs outline-none transition-all placeholder:text-text-muted"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"
                  >
                    {showConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {passwordStatus && (
                <div
                  className={`text-[11px] font-semibold py-2 px-3 rounded-lg border flex items-center gap-1.5 ${
                    passwordStatus.type === 'success'
                      ? 'bg-accent-green/5 border-accent-green/15 text-accent-green'
                      : 'bg-accent-red/5 border-accent-red/15 text-accent-red'
                  }`}
                >
                  <span>{passwordStatus.message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={updatingPassword}
                className="bg-accent-purple text-white text-xs font-semibold py-2 px-4 rounded-xl hover:bg-purple-600 transition-all cursor-pointer disabled:bg-text-muted"
              >
                {updatingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>

            {/* Session Info */}
            <div className="flex flex-col justify-between p-4 bg-bg-secondary/40 border border-border-soft rounded-xl">
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Session Security</h3>
                <div className="text-xs text-text-secondary space-y-1">
                  <div>Status: <span className="font-bold text-accent-green">Active Client Session</span></div>
                  <div>Expiry: <span className="font-semibold">{sessionExpiry}</span></div>
                </div>
                <p className="text-[10px] text-text-muted leading-relaxed">
                  For your privacy, sessions expire every 24 hours. Locking the workspace immediately discards all keys.
                </p>
              </div>

              <button
                onClick={handleLockNow}
                className="mt-6 flex items-center justify-center gap-1.5 bg-bg-card hover:bg-accent-red/5 border border-border-soft hover:border-accent-red/15 text-text-secondary hover:text-accent-red text-xs font-semibold py-2 px-4 rounded-xl transition-all cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock Workspace Now</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. Preferences & Default Tasks Section */}
        <div className="bg-bg-card border border-border-soft rounded-card shadow-card p-6 flex flex-col gap-5 hover:shadow-card-hover transition-all duration-300">
          <div className="flex items-center gap-2 border-b border-border-soft/60 pb-3">
            <ListTodo className="w-5 h-5 text-accent-blue" />
            <h2 className="text-base font-semibold text-text-primary">Default Tasks Editor</h2>
          </div>

          <div className="space-y-4">
            <p className="text-xs text-text-secondary leading-relaxed">
              These 5 items auto-populate your task list at the start of each day. Add, edit or delete tasks below.
            </p>

            {/* Tasks list */}
            <div className="space-y-2 max-w-lg">
              {defaultTasks.map((task, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2 px-3 bg-bg-secondary border border-border-soft/60 rounded-xl"
                >
                  <span className="text-xs font-semibold text-text-primary">{task}</span>
                  <button
                    onClick={() => handleDeleteDefaultTask(task)}
                    className="text-text-secondary hover:text-accent-red p-1 rounded-lg hover:bg-accent-red/5 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add inline form */}
            <div className="flex gap-2 max-w-lg">
              <input
                type="text"
                value={newDefaultTitle}
                onChange={(e) => setNewDefaultTitle(e.target.value)}
                placeholder="New default task title..."
                className="flex-1 bg-bg-secondary border border-border-soft/60 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/10 rounded-xl py-2 px-3 text-xs outline-none transition-all placeholder:text-text-muted"
              />
              <button
                onClick={handleAddDefaultTask}
                disabled={!newDefaultTitle.trim()}
                className="bg-accent-blue text-white text-xs font-semibold p-2 rounded-xl hover:bg-blue-600 transition-all disabled:opacity-40 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleSaveDefaultTasks}
              disabled={savingDefaults || defaultTasks.length === 0}
              className="mt-2 bg-accent-blue text-white text-xs font-semibold py-2 px-4 rounded-xl hover:bg-blue-600 transition-all cursor-pointer disabled:bg-text-muted"
            >
              {savingDefaults ? 'Saving Defaults...' : 'Save Default Tasks'}
            </button>
          </div>
        </div>

        {/* 3. Data & Backups Section */}
        <div className="bg-bg-card border border-border-soft rounded-card shadow-card p-6 flex flex-col gap-6 hover:shadow-card-hover transition-all duration-300">
          <div className="flex items-center gap-2 border-b border-border-soft/60 pb-3">
            <Download className="w-5 h-5 text-accent-green" />
            <h2 className="text-base font-semibold text-text-primary">Data & Backups</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Export data */}
            <div className="flex flex-col justify-between p-4 border border-border-soft rounded-xl bg-bg-secondary/20">
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Export Daily Records</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Export all your metrics, journal logs and tasks as a single JSON file. Ideal for backups.
                </p>
                <div className="text-[10px] text-text-muted font-bold">
                  Last Exported: <span className="text-text-secondary font-semibold">{lastExport}</span>
                </div>
              </div>

              <button
                onClick={handleExportData}
                disabled={isExporting}
                className="mt-6 flex items-center justify-center gap-1.5 bg-accent-green hover:bg-green-600 text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-sm transition-all cursor-pointer"
              >
                {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span>Download JSON Backup</span>
              </button>
            </div>

            {/* Danger Zone */}
            <div className="flex flex-col justify-between p-4 border border-accent-red/15 rounded-xl bg-accent-red/5">
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-accent-red uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Danger Zone</span>
                </h3>
                <p className="text-xs text-accent-red/80 leading-relaxed">
                  Permanently clear all logged notes, scoring graphs and task entries. Password hash will remain.
                </p>
              </div>

              <button
                onClick={() => setShowClearModal(true)}
                className="mt-6 bg-accent-red hover:bg-red-600 text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-sm transition-all cursor-pointer"
              >
                Clear All Workspace Data
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal overlay */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-card border border-border-soft rounded-card-lg max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 animate-scale-in">
            <div className="flex items-center gap-2 text-accent-red">
              <AlertTriangle className="w-6 h-6 shrink-0 animate-bounce" />
              <h3 className="text-base font-bold">Confirm Database Wipe</h3>
            </div>
            
            <p className="text-xs text-text-secondary leading-relaxed">
              This action is <span className="font-bold text-accent-red">permanent and irreversible</span>. 
              All task completion records, journaling entries and score data will be erased.
            </p>
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                Type "DELETE" below to confirm:
              </label>
              <input
                type="text"
                value={confirmDeleteText}
                onChange={(e) => setConfirmDeleteText(e.target.value)}
                placeholder="DELETE"
                className="w-full bg-bg-secondary border border-border-soft/60 focus:border-accent-red focus:ring-2 focus:ring-accent-red/10 rounded-xl py-2 px-3 text-xs outline-none transition-all"
              />
              {clearError && <span className="text-[10px] text-accent-red font-semibold">{clearError}</span>}
            </div>

            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setShowClearModal(false);
                  setConfirmDeleteText('');
                  setClearError('');
                }}
                disabled={clearingData}
                className="bg-bg-secondary hover:bg-border-soft border border-border-soft/60 text-text-secondary text-xs font-semibold py-2 px-4 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleClearData}
                disabled={confirmDeleteText !== 'DELETE' || clearingData}
                className="bg-accent-red hover:bg-red-600 disabled:bg-text-muted text-white text-xs font-semibold py-2 px-4 rounded-xl cursor-pointer"
              >
                {clearingData ? 'Wiping DB...' : 'Wipe All Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
