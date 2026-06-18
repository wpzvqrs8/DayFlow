import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { DEFAULT_TASKS } from '@/lib/constants';

export async function GET() {
  try {
    const { data: config, error } = await supabaseAdmin
      .from('app_config')
      .select('default_tasks')
      .eq('id', 1)
      .single();

    if (error) {
      return NextResponse.json({ defaultTasks: DEFAULT_TASKS });
    }

    return NextResponse.json({ defaultTasks: config?.default_tasks || DEFAULT_TASKS });
  } catch {
    return NextResponse.json({ defaultTasks: DEFAULT_TASKS });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { defaultTasks } = body;

    if (!Array.isArray(defaultTasks)) {
      return NextResponse.json({ error: 'Default tasks must be an array' }, { status: 400 });
    }

    const cleanTasks = defaultTasks
      .map((t: any) => String(t).trim())
      .filter((t: string) => t.length > 0);

    if (cleanTasks.length === 0) {
      return NextResponse.json({ error: 'At least one default task is required' }, { status: 400 });
    }

    const { error: updateError } = await supabaseAdmin
      .from('app_config')
      .update({ default_tasks: cleanTasks })
      .eq('id', 1);

    if (updateError) {
      console.error('Save default tasks error:', updateError);
      return NextResponse.json({ error: 'Failed to update default tasks list' }, { status: 500 });
    }

    return NextResponse.json({ success: true, defaultTasks: cleanTasks });
  } catch (error) {
    console.error('Default tasks save error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
