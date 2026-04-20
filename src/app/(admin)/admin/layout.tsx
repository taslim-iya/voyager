import Sidebar from '@/components/layout/Sidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let user = { name: 'Demo Admin', email: 'admin@demo.com', role: 'admin', orgName: 'Demo Corp' };

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = await createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile } = await supabase.from('users').select('*, organizations(name)').eq('id', authUser.id).single();
        if (profile) {
          user = { name: profile.full_name, email: authUser.email || '', role: profile.role, orgName: (profile.organizations as any)?.name || 'Organization' };
        }
      }
    } catch {}
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar user={user} isAdmin={true} />
      <main style={{ flex: 1, overflow: 'auto', minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  );
}
