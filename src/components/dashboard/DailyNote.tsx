'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bold, Italic, List, BookOpen, Edit2, Loader2 } from 'lucide-react';
import { useNotes } from '@/hooks/useNotes';
import { getLocalDateString } from '@/lib/utils';
import IconContainer from '../shared/IconContainer';
import AutoSaveIndicator from '../shared/AutoSaveIndicator';

interface DailyNoteProps {
  date: string;
}

export default function DailyNote({ date }: DailyNoteProps) {
  const { note, isLoading, saveNote, saveStatus } = useNotes(date);
  const isToday = date === getLocalDateString();
  const [isEditingPast, setIsEditingPast] = useState(false);
  const [content, setContent] = useState('');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Sync local content with note from SWR when it loads
  useEffect(() => {
    if (note) {
      setContent(note.content);
    } else {
      setContent('');
    }
    setIsEditingPast(false); // Reset past edit mode on date change
  }, [note, date]);

  // 2. Debounced auto-save function
  const handleContentChange = (val: string) => {
    setContent(val);
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveNote(val).catch((err) => {
        console.error('Failed to auto-save note:', err);
      });
    }, 1000); // 1-second debounce
  };

  // 3. Toolbar formatting actions
  const applyFormatting = (formatType: 'bold' | 'italic' | 'list') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    let replacement = '';
    if (formatType === 'bold') {
      replacement = `**${selectedText || 'bold text'}**`;
    } else if (formatType === 'italic') {
      replacement = `*${selectedText || 'italic text'}*`;
    } else if (formatType === 'list') {
      replacement = `\n- ${selectedText || 'list item'}`;
    }

    const newContent = text.substring(0, start) + replacement + text.substring(end);
    handleContentChange(newContent);

    // Re-focus and set selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + (formatType === 'list' ? 3 : 2),
        start + replacement.length - (formatType === 'list' ? 0 : 2)
      );
    }, 50);
  };

  // 4. Calculate word and character count
  const charCount = content.length;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  const isReadOnly = !isToday && !isEditingPast;

  return (
    <div className="bg-bg-card border border-border-soft rounded-card shadow-card p-6 flex flex-col gap-4 select-none transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 min-h-[360px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <IconContainer icon={BookOpen} variant="orange" />
          <div>
            <h2 className="text-base font-semibold text-text-primary">Daily Notes</h2>
            <p className="text-xs text-text-secondary mt-0.5">Capture thoughts and reflections.</p>
          </div>
        </div>

        {/* Word count badge & Edit toggle for past dates */}
        <div className="flex items-center gap-2">
          {wordCount > 0 && (
            <span className="text-xs font-semibold text-accent-orange bg-accent-orange/10 py-1 px-2.5 rounded-full">
              {wordCount} {wordCount === 1 ? 'word' : 'words'}
            </span>
          )}
          {!isToday && (
            <button
              onClick={() => setIsEditingPast(!isEditingPast)}
              className={`flex items-center gap-1 text-xs font-semibold py-1 px-2.5 rounded-lg border transition-all cursor-pointer ${
                isEditingPast
                  ? 'bg-accent-blue/10 border-accent-blue/15 text-accent-blue'
                  : 'bg-bg-secondary border-border-soft text-text-secondary hover:text-text-primary'
              }`}
            >
              <Edit2 className="w-3 h-3" />
              <span>{isEditingPast ? 'Done Editing' : 'Edit Note'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Editor Frame */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-accent-orange animate-spin" />
        </div>
      ) : (
        <div className="flex-grow flex flex-col border border-border-soft rounded-xl bg-bg-secondary/40 overflow-hidden">
          {/* Toolbar (Only visible when editable) */}
          {!isReadOnly && (
            <div className="flex items-center gap-1 p-2 bg-bg-card border-b border-border-soft/60">
              <button
                type="button"
                onClick={() => applyFormatting('bold')}
                className="w-8 h-8 rounded-lg hover:bg-bg-secondary flex items-center justify-center text-text-secondary hover:text-text-primary transition-all cursor-pointer"
                title="Bold (**)"
              >
                <Bold className="w-4 h-4 stroke-[2.5]" />
              </button>
              <button
                type="button"
                onClick={() => applyFormatting('italic')}
                className="w-8 h-8 rounded-lg hover:bg-bg-secondary flex items-center justify-center text-text-secondary hover:text-text-primary transition-all cursor-pointer"
                title="Italic (*)"
              >
                <Italic className="w-4 h-4 stroke-[2.5]" />
              </button>
              <button
                type="button"
                onClick={() => applyFormatting('list')}
                className="w-8 h-8 rounded-lg hover:bg-bg-secondary flex items-center justify-center text-text-secondary hover:text-text-primary transition-all cursor-pointer"
                title="Bullet List (-)"
              >
                <List className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          )}

          {/* Text Area */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            disabled={isReadOnly}
            placeholder={
              isReadOnly
                ? 'No thoughts recorded for this date.'
                : 'Write about your day, ideas, or reflections (supports Markdown)...'
            }
            className="flex-1 w-full min-h-[200px] max-h-[300px] outline-none border-none resize-none p-4 text-sm leading-relaxed text-text-primary placeholder:text-text-muted bg-transparent focus:ring-0 disabled:text-text-secondary/80 disabled:cursor-not-allowed select-text"
          />

          {/* Bottom Info Bar */}
          <div className="flex items-center justify-between p-3 bg-bg-secondary/60 border-t border-border-soft/40 select-none text-[10px] text-text-muted font-semibold">
            <span>{charCount} characters</span>
            <AutoSaveIndicator status={saveStatus} />
          </div>
        </div>
      )}
    </div>
  );
}
