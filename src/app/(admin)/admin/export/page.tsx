'use client';

import { useState } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';

export default function ExportPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [format, setFormat] = useState('csv');
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ format, ...(startDate && { startDate }), ...(endDate && { endDate }) });
      const res = await fetch(`/api/export?${params}`);
      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voyager-export-${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 700 }}>
      <div className="page-header">
        <h1>Export Bookings</h1>
        <p>Download booking data in Ramp/Brex/Expensify-compatible format.</p>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>Export Settings</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>End Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Format</label>
            <select value={format} onChange={e => setFormat(e.target.value)} style={{ width: '100%' }}>
              <option value="csv">CSV</option>
              <option value="xlsx">Excel (XLSX)</option>
            </select>
          </div>
        </div>

        <div style={{ padding: 16, background: 'var(--bg-2)', borderRadius: 'var(--radius)', marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 8 }}>Columns Included</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {['Date', 'Description', 'Amount', 'Currency', 'Category', 'Department', 'Traveler', 'Reference', 'Status', 'Booking Method'].map(col => (
              <span key={col} className="badge badge-neutral">{col}</span>
            ))}
          </div>
        </div>

        <button className="btn-primary" onClick={handleExport} disabled={loading}>
          {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={14} />}
          {loading ? 'Exporting...' : 'Download Export'}
        </button>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
          <strong>Compatibility:</strong> Export format is compatible with Ramp, Brex, Expensify, and most accounting software. Leave dates blank to export all bookings.
        </div>
      </div>
    </div>
  );
}
