import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect('/login');

  const { data: profile } = await supabase.from('users').select('*, organizations(name)').eq('id', authUser.id).single();
  if (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) redirect('/');

  const user = {
    name: profile.full_name,
    email: authUser.email || '',
    role: profile.role,
    orgName: (profile.organizations as any)?.name || 'Organization',
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar user={user} isAdmin={true} />
      <main style={{ flex: 1, overflow: 'auto', minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  );
}
