import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { confirmation } = body;

    if (confirmation !== 'DELETE') {
      return NextResponse.json({ error: 'Invalid confirmation. Please type "DELETE"' }, { status: 400 });
    }

    // 1. Delete all tracking records
    const { error: reportsError } = await supabaseAdmin.from('daily_reports').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    const { error: tasksError } = await supabaseAdmin.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    const { error: notesError } = await supabaseAdmin.from('daily_notes').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    if (reportsError || tasksError || notesError) {
      console.error('Clear data error details:', { reportsError, tasksError, notesError });
      return NextResponse.json({ error: 'Failed to clear some tracking tables' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'All tracking records cleared successfully.' });
  } catch (error) {
    console.error('Clear tracking data error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
