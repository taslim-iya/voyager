'use client';

import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error?: Error; }

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) { super(props); this.state = { hasError: false }; }

  static getDerivedStateFromError(error: Error): State { return { hasError: true, error }; }

  componentDidCatch(error: Error, info: any) { console.error('ErrorBoundary caught:', error, info); }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <AlertTriangle size={32} style={{ color: 'var(--orange)', marginBottom: 12 }} />
          <h3 style={{ fontFamily: 'var(--serif)', fontSize: 18, marginBottom: 8 }}>Something went wrong</h3>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 16 }}>{this.state.error?.message || 'An unexpected error occurred.'}</p>
          <button className="btn-secondary" onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}>
            <RefreshCw size={14} /> Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
