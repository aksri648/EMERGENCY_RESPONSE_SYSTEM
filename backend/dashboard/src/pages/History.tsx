import { useMemo, useState } from 'react';
import { useCases } from '../context/CasesContext';
import { CaseCard } from '../components/CaseCard';
import { CaseDetail } from '../components/CaseDetail';
import { EmergencyCase } from '../types';

export function History() {
  const { cases, updateCaseStatus } = useCases();
  const [open, setOpen] = useState<EmergencyCase | null>(null);

  const resolved = useMemo(
    () =>
      cases
        .filter((c) => c.status === 'resolved')
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [cases]
  );

  if (resolved.length === 0) {
    return <div className="empty-state">No resolved cases yet.</div>;
  }
  return (
    <div className="case-list">
      {resolved.map((c) => (
        <CaseCard
          key={c.id}
          c={c}
          onOpen={() => setOpen(c)}
          onUpdate={(s) => updateCaseStatus(c.id, s)}
        />
      ))}
      <CaseDetail c={open} onClose={() => setOpen(null)} />
    </div>
  );
}
