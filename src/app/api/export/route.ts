import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as XLSX from 'xlsx';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'csv';
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('users').select('org_id, role').eq('id', user.id).single();
    if (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Get all users for name lookup
    const { data: orgUsers } = await supabase.from('users').select('id, full_name, department').eq('org_id', profile.org_id);
    const userMap: Record<string, { name: string; dept: string }> = {};
    (orgUsers || []).forEach(u => { userMap[u.id] = { name: u.full_name, dept: u.department || '' }; });

    // Get flights
    let flightQuery = supabase
      .from('flight_bookings')
      .select('*, trips!inner(org_id, user_id, title, start_date)')
      .eq('trips.org_id', profile.org_id);

    const { data: flights } = await flightQuery;

    // Get hotels
    let hotelQuery = supabase
      .from('hotel_bookings')
      .select('*, trips!inner(org_id, user_id, title, start_date)')
      .eq('trips.org_id', profile.org_id);

    const { data: hotels } = await hotelQuery;

    // Build rows
    const rows: any[] = [];

    (flights || []).forEach(f => {
      const trip = f.trips as any;
      const user = userMap[trip?.user_id] || { name: 'Unknown', dept: '' };
      const date = f.booked_at || f.created_at;
      if (startDate && date < startDate) return;
      if (endDate && date > endDate) return;

      rows.push({
        Date: new Date(date).toISOString().split('T')[0],
        Description: `Flight - ${trip?.title || 'Untitled'}`,
        Amount: f.total_amount,
        Currency: f.currency,
        Category: 'Flights',
        Department: user.dept,
        Traveler: user.name,
        Reference: f.pnr || f.duffel_order_id || '',
        Status: f.status,
        'Booking Method': f.booking_method,
      });
    });

    (hotels || []).forEach(h => {
      const trip = h.trips as any;
      const user = userMap[trip?.user_id] || { name: 'Unknown', dept: '' };
      const date = h.booked_at || h.created_at;
      if (startDate && date < startDate) return;
      if (endDate && date > endDate) return;

      rows.push({
        Date: new Date(date).toISOString().split('T')[0],
        Description: `Hotel - ${h.hotel_name}`,
        Amount: h.total_amount,
        Currency: h.currency,
        Category: 'Hotels',
        Department: user.dept,
        Traveler: user.name,
        Reference: h.provider_ref || '',
        Status: h.status,
        'Booking Method': h.provider,
      });
    });

    rows.sort((a, b) => b.Date.localeCompare(a.Date));

    if (format === 'xlsx') {
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Bookings');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      return new NextResponse(buf, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="voyager-export.xlsx"`,
        },
      });
    }

    // CSV
    if (rows.length === 0) return new NextResponse('No data', { status: 200 });
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${(r[h] ?? '').toString().replace(/"/g, '""')}"`).join(','))].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="voyager-export.csv"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
