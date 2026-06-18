import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase';
import { signSessionJWT, checkRateLimit, recordFailedAttempt, clearFailedAttempts } from '@/lib/auth';
import { COOKIE_NAME } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    // 1. Get Client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    
    // 2. Check rate limiting
    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many failed attempts. Please wait ${rateLimit.cooldownTime} seconds.`, cooldown: rateLimit.cooldownTime },
        { status: 429 }
      );
    }

    // 3. Parse input
    const { password, isSetup = false } = await request.json();
    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    // 4. Fetch app configuration
    const { data: config, error: configError } = await supabaseAdmin
      .from('app_config')
      .select('*')
      .eq('id', 1)
      .single();

    if (configError && configError.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Failed to retrieve configuration' }, { status: 500 });
    }

    const setupComplete = config?.setup_complete || false;

    // 5. Handle First-Run Setup
    if (!setupComplete && isSetup) {
      if (password.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
      }

      // Hash password
      const hash = bcrypt.hashSync(password, 10);

      // Insert or update config row
      const { error: saveError } = await supabaseAdmin
        .from('app_config')
        .upsert({ id: 1, password_hash: hash, setup_complete: true });

      if (saveError) {
        return NextResponse.json({ error: 'Failed to configure password' }, { status: 500 });
      }

      // Seed default tasks for today
      const today = new Date().toISOString().split('T')[0];
      const defaultTaskTitles = [
        '2h Maths',
        '2h Fee',
        '2h Java',
        '2h DS',
        '2h DBMS',
        '2h extra',
        '30 min excerrcise'
      ];
      
      const seedTasks = defaultTaskTitles.map(title => ({
        title,
        is_default: true,
        date: today,
        is_completed: false
      }));

      await supabaseAdmin.from('tasks').insert(seedTasks);

      // Issue token and set cookie
      const token = await signSessionJWT();
      const cookieStore = await cookies();
      cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 60 * 60, // 24 hours
      });

      return NextResponse.json({ success: true, message: 'Setup completed successfully' });
    }

    // 6. Handle standard unlock flow
    if (!setupComplete) {
      // Config exists but setup is false, or config row doesn't exist
      return NextResponse.json({ error: 'Setup is not complete. Please complete setup.', needsSetup: true }, { status: 400 });
    }

    // Compare input with password hash in database
    const match = bcrypt.compareSync(password, config.password_hash);
    if (!match) {
      recordFailedAttempt(ip);
      const updatedRateLimit = checkRateLimit(ip);
      
      return NextResponse.json({
        error: 'Incorrect password',
        attemptsRemaining: updatedRateLimit.remainingAttempts,
        cooldown: updatedRateLimit.cooldownTime
      }, { status: 401 });
    }

    // Clear failed attempts for the IP on success
    clearFailedAttempts(ip);

    // Issue JWT and set cookie
    const token = await signSessionJWT();
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60, // 24 hours
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET route to check if setup is needed
export async function GET() {
  try {
    const { data: config, error } = await supabaseAdmin
      .from('app_config')
      .select('setup_complete')
      .eq('id', 1)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Failed to retrieve configuration status' }, { status: 500 });
    }

    const needsSetup = !config || !config.setup_complete;
    return NextResponse.json({ needsSetup });
  } catch (error) {
    return NextResponse.json({ needsSetup: true });
  }
}
