import { useMemo, useState } from 'react';
import { useCases } from '../context/CasesContext';
import { CaseCard } from '../components/CaseCard';
import { CaseDetail } from '../components/CaseDetail';
import { EmergencyCase, Severity } from '../types';

type Filter = 'all' | Severity;

const SEV_ORDER: Record<Severity, number> = { critical: 0, high: 1, medium: 2 };

export function Incidents() {
  const { cases, updateCaseStatus } = useCases();
  const [filter, setFilter] = useState<Filter>('all');
  const [open, setOpen] = useState<EmergencyCase | null>(null);

  const visible = useMemo(() => {
    return cases
      .filter((c) => c.status !== 'resolved')
      .filter((c) => filter === 'all' || c.severity === filter)
      .sort((a, b) => {
        const s = SEV_ORDER[a.severity] - SEV_ORDER[b.severity];
        if (s !== 0) return s;
        return b.createdAt.localeCompare(a.createdAt);
      });
  }, [cases, filter]);

  return (
    <div>
      <div className="filter-row">
        {(['all', 'critical', 'high', 'medium'] as Filter[]).map((f) => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? 'filter-btn-active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>
      {visible.length === 0 ? (
        <div className="empty-state">No active incidents.</div>
      ) : (
        <div className="case-list">
          {visible.map((c) => (
            <CaseCard
              key={c.id}
              c={c}
              onOpen={() => setOpen(c)}
              onUpdate={(s) => updateCaseStatus(c.id, s)}
            />
          ))}
        </div>
      )}
      <CaseDetail c={open} onClose={() => setOpen(null)} />
    </div>
  );
}
