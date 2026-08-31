'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck, Loader2, CheckCircle2, XCircle, FileText, AlertTriangle,
  Stethoscope, MapPin, Languages, Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DocInfo {
  id: string;
  docType: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  uploadedAt: string;
  status: string;
  reviewedAt: string | null;
  notes: string | null;
}

interface DoctorInfo {
  id: string;
  userId: string;
  name: string | null;
  email: string;
  accountStatus: string;
  pmdcNumber: string;
  pmdcVerifiedAt: string | null;
  specialty: string;
  subSpecialty: string | null;
  facilityName: string | null;
  facilityCity: string | null;
  yearsExperience: number | null;
  languages: string[];
  bio: string | null;
  createdAt: string;
  docs: DocInfo[];
}

type Filter = 'pending_verification' | 'active' | 'suspended' | 'all';

const DOC_TYPE_LABELS: Record<string, string> = {
  pmdc_card: 'PMDC Card',
  cnic: 'CNIC',
  degree: 'Medical Degree',
  experience_letter: 'Experience Letter',
};

export function DoctorVerificationsView() {
  const [doctors, setDoctors] = useState<DoctorInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('pending_verification');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/doctor-verifications?status=${filter}`, { cache: 'no-store' });
      if (!res.ok) {
        if (res.status === 403) { setError('Forbidden — admin role required.'); return; }
        setError(`Failed to load (${res.status})`);
        return;
      }
      const data = await res.json();
      setDoctors(data.doctors ?? []);
      setError(null);
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const verify = useCallback(async (doctor: DoctorInfo, action: 'approve' | 'reject') => {
    setActing(doctor.id);
    try {
      const res = await fetch('/api/admin/verify-doctor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorProfileId: doctor.id,
          action,
          notes: notes[doctor.id] ?? undefined,
        }),
      });
      if (!res.ok) { toast.error(`Failed to ${action} doctor.`); return; }
      toast.success(action === 'approve' ? `Dr. ${doctor.name} approved. They can now log in.` : `Dr. ${doctor.name} rejected.`);
      await load();
    } finally {
      setActing(null);
    }
  }, [notes, load]);

  return (
    <div className="space-y-4">
      {/* header */}
      <div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          <h2 className="text-base font-bold text-foreground">Doctor PMDC Verifications</h2>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Review uploaded PMDC cards + CNIC + degrees. Approve to grant doctor portal access.
        </p>
      </div>

      {/* filter chips */}
      <div className="flex flex-wrap gap-1.5">
        {([
          { v: 'pending_verification', label: 'Pending', color: 'amber' },
          { v: 'active', label: 'Approved', color: 'emerald' },
          { v: 'suspended', label: 'Rejected', color: 'red' },
          { v: 'all', label: 'All', color: 'slate' },
        ] as const).map((f) => (
          <button
            key={f.v}
            type="button"
            onClick={() => setFilter(f.v as Filter)}
            className={cn(
              'inline-flex min-h-9 items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
              filter === f.v
                ? f.color === 'amber' ? 'border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-400'
                  : f.color === 'emerald' ? 'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                  : f.color === 'red' ? 'border-red-500 bg-red-500/15 text-red-700 dark:text-red-400'
                  : 'border-slate-500 bg-slate-500/15 text-slate-700 dark:text-slate-300'
                : 'border-border bg-background text-muted-foreground hover:bg-accent',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* doctor list */}
      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl border border-border bg-card/50" />)}
        </div>
      ) : error ? (
        <Card className="border-red-500/30 bg-red-50/50 dark:bg-red-950/10">
          <CardContent className="p-4 text-sm text-red-700 dark:text-red-400">{error}</CardContent>
        </Card>
      ) : doctors.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
          <ShieldCheck className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {filter === 'pending_verification' ? 'No pending verifications — all caught up!' : 'No doctors in this category.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {doctors.map((d) => (
            <motion.li key={d.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <Card className={cn(
                'shadow-sm',
                d.accountStatus === 'pending_verification' ? 'border-amber-500/40' :
                d.accountStatus === 'active' ? 'border-emerald-500/40' :
                d.accountStatus === 'suspended' ? 'border-red-500/40' : 'border-border',
              )}>
                <CardContent className="p-4">
                  {/* header */}
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
                      <Stethoscope className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <h3 className="text-sm font-bold text-foreground">Dr. {d.name ?? 'Unknown'}</h3>
                        <span className="text-xs text-muted-foreground">{d.email}</span>
                        <Badge className={cn('text-[10px] font-bold',
                          d.accountStatus === 'pending_verification' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400' :
                          d.accountStatus === 'active' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' :
                          d.accountStatus === 'suspended' ? 'bg-red-500/15 text-red-700 dark:text-red-400' : 'bg-muted text-muted-foreground')}>
                          {d.accountStatus.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        <span className="font-mono font-bold text-foreground">{d.pmdcNumber}</span>
                        <span>·</span>
                        <span>{d.specialty}{d.subSpecialty ? ` (${d.subSpecialty})` : ''}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        {d.facilityName ? (
                          <span className="flex items-center gap-0.5"><Briefcase className="h-3 w-3" /> {d.facilityName}</span>
                        ) : null}
                        {d.facilityCity ? (
                          <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" /> {d.facilityCity}</span>
                        ) : null}
                        {d.yearsExperience != null ? <span>{d.yearsExperience}y exp</span> : null}
                        {d.languages.length > 0 ? (
                          <span className="flex items-center gap-0.5"><Languages className="h-3 w-3" /> {d.languages.join(', ')}</span>
                        ) : null}
                      </div>
                      {d.bio ? <p className="mt-1 text-xs italic text-muted-foreground">{d.bio}</p> : null}
                      <p className="mt-1 text-[10px] text-muted-foreground">Registered {new Date(d.createdAt).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* expand button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
                    className="mt-3 min-h-9 w-full justify-start gap-1.5 text-xs"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    {d.docs.length} verification document{d.docs.length !== 1 ? 's' : ''}
                    {expandedId === d.id ? ' (hide)' : ' (show)'}
                  </Button>

                  {/* expanded: docs + actions */}
                  {expandedId === d.id ? (
                    <div className="mt-3 space-y-3 border-t border-border pt-3">
                      {/* docs */}
                      {d.docs.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No documents uploaded.</p>
                      ) : (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {d.docs.map((doc) => (
                            <div key={doc.id} className="rounded-lg border border-border bg-background p-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-foreground">{DOC_TYPE_LABELS[doc.docType] ?? doc.docType}</span>
                                <Badge className={cn('text-[9px] font-bold',
                                  doc.status === 'approved' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' :
                                  doc.status === 'rejected' ? 'bg-red-500/15 text-red-700 dark:text-red-400' :
                                  'bg-amber-500/15 text-amber-700 dark:text-amber-400')}>
                                  {doc.status}
                                </Badge>
                              </div>
                              <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{doc.fileName}</p>
                              <a href={`/api/admin/doctor-doc?id=${doc.id}`} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline">
                                <FileText className="h-3 w-3" /> View document
                              </a>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* actions (only for pending) */}
                      {d.accountStatus === 'pending_verification' ? (
                        <div className="space-y-2 rounded-lg border border-border bg-background p-3">
                          <div>
                            <Label htmlFor={`notes-${d.id}`} className="text-xs font-semibold">Reviewer notes (optional)</Label>
                            <Textarea
                              id={`notes-${d.id}`}
                              rows={2}
                              value={notes[d.id] ?? ''}
                              onChange={(e) => setNotes((n) => ({ ...n, [d.id]: e.target.value }))}
                              placeholder="e.g. PMDC verified via pmdc.org.pk — number matches card."
                              className="mt-1 rounded-xl text-xs"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              disabled={acting === d.id}
                              onClick={() => verify(d, 'approve')}
                              className="min-h-9 flex-1 gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                              {acting === d.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                              Approve
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={acting === d.id}
                              onClick={() => verify(d, 'reject')}
                              className="min-h-9 flex-1 gap-1.5 border-red-500/40 text-red-700 hover:bg-red-500/5 dark:text-red-400"
                            >
                              {acting === d.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                              Reject
                            </Button>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            Approving will sign the doctor out and require them to log in again with their new active status.
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-border bg-background p-3">
                          <p className="text-xs text-muted-foreground">
                            Status: <span className="font-bold text-foreground">{d.accountStatus}</span>.
                            {d.pmdcVerifiedAt ? ` Verified on ${new Date(d.pmdcVerifiedAt).toLocaleString()}.` : ''}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
