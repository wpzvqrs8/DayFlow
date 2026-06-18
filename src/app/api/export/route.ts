import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getLocalDateString } from '@/lib/utils';

export async function GET() {
  try {
    // 1. Fetch all reports
    const { data: reports, error: reportsError } = await supabaseAdmin
      .from('daily_reports')
      .select('*')
      .order('date', { ascending: false });

    if (reportsError) {
      console.error('Export error (reports):', reportsError);
      return NextResponse.json({ error: 'Failed to export reports' }, { status: 500 });
    }

    // 2. Fetch all tasks
    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: true });

    if (tasksError) {
      console.error('Export error (tasks):', tasksError);
      return NextResponse.json({ error: 'Failed to export tasks' }, { status: 500 });
    }

    // 3. Fetch all notes
    const { data: notes, error: notesError } = await supabaseAdmin
      .from('daily_notes')
      .select('*')
      .order('date', { ascending: false });

    if (notesError) {
      console.error('Export error (notes):', notesError);
      return NextResponse.json({ error: 'Failed to export notes' }, { status: 500 });
    }

    // 4. Create export payload
    const exportData = {
      exportedAt: new Date().toISOString(),
      reports: reports || [],
      tasks: tasks || [],
      notes: notes || []
    };

    // 5. Generate filename
    const dateStr = getLocalDateString();
    const filename = `dayflow_export_${dateStr}.json`;

    // 6. Return downloadable JSON response
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    console.error('Export GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
