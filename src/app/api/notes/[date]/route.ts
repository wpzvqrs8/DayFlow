import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET daily note for a specific date
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params;

    const { data: note, error } = await supabaseAdmin
      .from('daily_notes')
      .select('*')
      .eq('date', date)
      .maybeSingle();

    if (error) {
      console.error('Error fetching note:', error);
      return NextResponse.json({ error: 'Failed to fetch note' }, { status: 500 });
    }

    if (!note) {
      return NextResponse.json({
        date,
        content: ''
      });
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error('Notes GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST/PUT to upsert a daily note
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params;
    const body = await request.json();
    const { content } = body;

    const { data: note, error } = await supabaseAdmin
      .from('daily_notes')
      .upsert({
        date,
        content: content || '',
        updated_at: new Date().toISOString()
      }, { onConflict: 'date' })
      .select()
      .single();

    if (error) {
      console.error('Error saving note:', error);
      return NextResponse.json({ error: 'Failed to save note' }, { status: 500 });
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error('Notes POST/PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Map PUT to POST handler
export { POST as PUT };
