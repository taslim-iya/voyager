import { Check, AlertTriangle, X } from 'lucide-react';

interface PolicyCheckResult {
  compliant: boolean;
  violations: { rule: string; message: string; severity: string }[];
  requiresApproval: boolean;
}

export default function PolicyBadge({ check }: { check: PolicyCheckResult }) {
  if (check.compliant) {
    return <span className="badge badge-success"><Check size={10} /> In Policy</span>;
  }

  const hasBlocking = check.violations.some(v => v.severity === 'block');

  return (
    <div>
      <span className={`badge ${hasBlocking ? 'badge-danger' : 'badge-warning'}`}>
        {hasBlocking ? <X size={10} /> : <AlertTriangle size={10} />}
        {hasBlocking ? 'Blocked' : 'Out of Policy'}
      </span>
      {check.violations.map((v, i) => (
        <div key={i} style={{ fontSize: 9, color: hasBlocking ? 'var(--red)' : 'var(--orange)', marginTop: 2 }}>{v.message}</div>
      ))}
      {check.requiresApproval && <div style={{ fontSize: 9, color: 'var(--blue)', marginTop: 2 }}>Requires approval</div>}
    </div>
  );
}
