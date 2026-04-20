'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Plane, Hotel, Briefcase, Users, Shield, BarChart3, FileText, Settings, LogOut, ChevronRight } from 'lucide-react';

const travelerNav = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/search/flights', icon: Plane, label: 'Search Flights' },
  { path: '/search/hotels', icon: Hotel, label: 'Search Hotels' },
  { path: '/trips', icon: Briefcase, label: 'My Trips' },
];

const adminNav = [
  { path: '/admin', icon: BarChart3, label: 'Dashboard' },
  { path: '/admin/users', icon: Users, label: 'Users' },
  { path: '/admin/policy', icon: Shield, label: 'Travel Policy' },
  { path: '/admin/trips', icon: Briefcase, label: 'All Trips' },
  { path: '/admin/approvals', icon: FileText, label: 'Approvals' },
  { path: '/admin/export', icon: FileText, label: 'Export' },
];

export default function Sidebar({ user, isAdmin }: { user: { name: string; email: string; role: string; orgName: string }; isAdmin: boolean }) {
  const pathname = usePathname();

  return (
    <>
      <aside className="desktop-sidebar" style={{ width: 240, flexShrink: 0, background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0 }}>
        <div style={{ padding: '20px 20px 12px', borderBottom: '1px solid var(--border)' }}>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em' }}>Voyager</h1>
          <p style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>{user.orgName}</p>
        </div>

        <nav style={{ flex: 1, padding: '8px 0', overflow: 'auto' }}>
          <div style={{ padding: '6px 20px', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)' }}>Travel</div>
          {travelerNav.map(item => {
            const active = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
            return (
              <Link key={item.path} href={item.path} className={`nav-item ${active ? 'nav-item-active' : ''}`} style={{ textDecoration: 'none' }}>
                <item.icon size={16} /><span>{item.label}</span>
              </Link>
            );
          })}

          {isAdmin && (
            <>
              <div style={{ padding: '16px 20px 6px', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)' }}>Admin</div>
              {adminNav.map(item => {
                const active = pathname === item.path;
                return (
                  <Link key={item.path} href={item.path} className={`nav-item ${active ? 'nav-item-active' : ''}`} style={{ textDecoration: 'none' }}>
                    <item.icon size={16} /><span>{item.label}</span>
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
              {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
              <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{user.role}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <Link href="/profile" className="btn-ghost" style={{ fontSize: 10, padding: '4px 8px', flex: 1, justifyContent: 'center' }}>
              <Settings size={12} /> Profile
            </Link>
            <form action="/api/auth/signout" method="POST">
              <button type="submit" className="btn-ghost" style={{ fontSize: 10, padding: '4px 8px' }}>
                <LogOut size={12} />
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="mobile-nav" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--surface)', borderTop: '1px solid var(--border)', zIndex: 100, justifyContent: 'space-around', padding: '6px 0' }}>
        {travelerNav.map(item => {
          const active = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
          return (
            <Link key={item.path} href={item.path} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, textDecoration: 'none', color: active ? 'var(--text)' : 'var(--text-3)', fontSize: 9, fontWeight: active ? 600 : 400 }}>
              <item.icon size={18} />{item.label.replace('Search ', '')}
            </Link>
          );
        })}
        {isAdmin && (
          <Link href="/admin" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, textDecoration: 'none', color: pathname.startsWith('/admin') ? 'var(--text)' : 'var(--text-3)', fontSize: 9 }}>
            <Shield size={18} />Admin
          </Link>
        )}
      </div>
    </>
  );
}
