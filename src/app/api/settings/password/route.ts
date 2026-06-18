import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current password and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters long' }, { status: 400 });
    }

    // Fetch master config hash
    const { data: config, error: configError } = await supabaseAdmin
      .from('app_config')
      .select('password_hash')
      .eq('id', 1)
      .single();

    if (configError || !config) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 500 });
    }

    // Verify current password
    const match = bcrypt.compareSync(currentPassword, config.password_hash);
    if (!match) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
    }

    // Hash and save new password
    const newHash = bcrypt.hashSync(newPassword, 10);
    const { error: updateError } = await supabaseAdmin
      .from('app_config')
      .update({ password_hash: newHash })
      .eq('id', 1);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
