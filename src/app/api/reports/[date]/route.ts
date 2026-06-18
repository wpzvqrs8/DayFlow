import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET report for a specific date
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params;
    
    const { data: report, error } = await supabaseAdmin
      .from('daily_reports')
      .select('*')
      .eq('date', date)
      .maybeSingle();

    if (error) {
      console.error('Error fetching report:', error);
      return NextResponse.json({ error: 'Failed to fetch daily report' }, { status: 500 });
    }

    if (!report) {
      // Return default structure if it does not exist
      return NextResponse.json({
        date,
        score: 50,
        accomplishments: '',
        challenges: '',
        reflections: ''
      });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error('Daily report GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST/PUT to upsert a daily report
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params;
    const body = await request.json();
    
    const { score, accomplishments, challenges, reflections } = body;
    
    // Validate score
    const cleanScore = typeof score === 'number' ? Math.max(0, Math.min(100, score)) : 50;

    const { data: report, error } = await supabaseAdmin
      .from('daily_reports')
      .upsert({
        date,
        score: cleanScore,
        accomplishments: accomplishments || '',
        challenges: challenges || '',
        reflections: reflections || '',
        updated_at: new Date().toISOString()
      }, { onConflict: 'date' })
      .select()
      .single();

    if (error) {
      console.error('Error upserting report:', error);
      return NextResponse.json({ error: 'Failed to save daily report' }, { status: 500 });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error('Daily report POST/PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Map PUT to the same handler
export { POST as PUT };
