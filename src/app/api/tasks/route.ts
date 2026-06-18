import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getLocalDateString } from '@/lib/utils';
import { DEFAULT_TASKS } from '@/lib/constants';

// GET tasks for a specific date
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || getLocalDateString();

    // 1. Fetch tasks for the date
    const { data: tasks, error } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('date', date)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching tasks:', error);
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }

    // 2. If no tasks exist, auto-seed the default ones
    if (tasks.length === 0) {
      // Fetch user-configured default tasks
      const { data: config } = await supabaseAdmin
        .from('app_config')
        .select('default_tasks')
        .eq('id', 1)
        .single();
      
      const activeDefaultTasks = config?.default_tasks || DEFAULT_TASKS;

      const defaultTasksToInsert = activeDefaultTasks.map((title: string) => ({
        title,
        is_default: true,
        date: date,
        is_completed: false,
        completed_at: null
      }));

      const { data: seededTasks, error: seedError } = await supabaseAdmin
        .from('tasks')
        .insert(defaultTasksToInsert)
        .select();

      if (seedError) {
        console.error('Error seeding default tasks:', seedError);
        return NextResponse.json({ error: 'Failed to seed default tasks' }, { status: 500 });
      }

      return NextResponse.json(seededTasks);
    }

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Tasks GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST to create a custom task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, date = getLocalDateString() } = body;

    if (!title) {
      return NextResponse.json({ error: 'Task title is required' }, { status: 400 });
    }

    const { data: task, error } = await supabaseAdmin
      .from('tasks')
      .insert({
        title,
        is_default: false,
        date,
        is_completed: false,
        completed_at: null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('Tasks POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
