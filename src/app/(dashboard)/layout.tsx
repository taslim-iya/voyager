import Sidebar from '@/components/layout/Sidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let user = { name: 'Demo User', email: 'demo@voyager.app', role: 'admin', orgName: 'Demo Corp' };

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = await createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (authUser) {
        const { data: profile } = await supabase
          .from('users')
          .select('*, organizations(name)')
          .eq('id', authUser.id)
          .single();

        user = {
          name: profile?.full_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
          email: authUser.email || '',
          role: profile?.role || 'admin',
          orgName: (profile?.organizations as any)?.name || authUser.user_metadata?.org_name || 'My Organization',
        };
      }
    } catch {}
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar user={user} isAdmin={user.role === 'admin' || user.role === 'manager'} />
      <main style={{ flex: 1, overflow: 'auto', minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  );
}
