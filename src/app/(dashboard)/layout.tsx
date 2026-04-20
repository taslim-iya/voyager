import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) redirect('/login');

  // Get user profile
  const { data: profile } = await supabase
    .from('users')
    .select('*, organizations(name)')
    .eq('id', authUser.id)
    .single();

  const user = {
    name: profile?.full_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
    email: authUser.email || '',
    role: profile?.role || 'traveler',
    orgName: (profile?.organizations as any)?.name || authUser.user_metadata?.org_name || 'My Organization',
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar user={user} isAdmin={user.role === 'admin' || user.role === 'manager'} />
      <main style={{ flex: 1, overflow: 'auto', minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  );
}
