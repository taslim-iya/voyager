import { NextResponse } from 'next/server';
import { createClient, createAdmin } from '@/lib/supabase/server';
import { sendInviteEmail } from '@/lib/email/resend';
import logger from '@/lib/logger';
import crypto from 'crypto';

export async function POST(request: Request) {
  const body = await request.json();

  // Accept invite (from invite page)
  if (body.token) {
    const { token, fullName, email, password } = body;
    const adminSupa = createAdmin();

    // Find invite
    const { data: org } = await adminSupa
      .from('organizations')
      .select('id, name')
      .eq('policy_config->>invite_token', token)
      .single();

    if (!org) return NextResponse.json({ error: 'Invalid or expired invite token' }, { status: 400 });

    // Create auth user
    const { data: authData, error: authError } = await adminSupa.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });

    // Create profile
    await adminSupa.from('users').insert({
      id: authData.user.id,
      org_id: org.id,
      email,
      full_name: fullName,
      role: 'traveler',
    });

    return NextResponse.json({ success: true });
  }

  // Create invite (from admin)
  if (body.action === 'create') {
    const { email, role, department, budget, orgId } = body;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify admin
    const { data: profile } = await supabase.from('users').select('role, org_id').eq('id', user.id).single();
    if (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Generate invite token
    const token = crypto.randomBytes(32).toString('hex');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteUrl = `${appUrl}/invite/${token}`;

    // Store token on org (simple approach)
    await supabase.from('organizations').update({
      policy_config: { invite_token: token, invite_email: email, invite_role: role, invite_department: department, invite_budget: budget },
    }).eq('id', profile.org_id);

    // Get org name
    const { data: org } = await supabase.from('organizations').select('name').eq('id', profile.org_id).single();

    // Send email
    await sendInviteEmail(email, org?.name || 'Your company', inviteUrl);

    logger.info({ email, org_id: profile.org_id }, 'Invite sent');

    return NextResponse.json({ success: true, inviteUrl });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
