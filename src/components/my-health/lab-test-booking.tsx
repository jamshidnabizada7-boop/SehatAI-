'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlaskConical, Loader2, Plus, X, CheckCircle2, Clock, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface LabTest { id: string; labName: string; testName: string; status: string; scheduledAt: string | null; notes: string | null; createdAt: string; }
interface PartnerLab { name: string; cities: string[]; }
interface LabTestData { tests: LabTest[]; partnerLabs: PartnerLab[]; commonTests: string[]; }

export function LabTestBooking() {
  const [data, setData] = useState<LabTestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [labName, setLabName] = useState('');
  const [testName, setTestName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await fetch('/api/lab-tests', { cache: 'no-store' }); if (r.ok) setData(await r.json()); } catch {}
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!labName || !testName) return toast.error('Select a lab and test.');
    setSubmitting(true);
    try {
      const r = await fetch('/api/lab-tests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ labName, testName }) });
      if (!r.ok) return toast.error('Failed to book test.');
      toast.success('Lab test requested! The lab will confirm shortly.');
      setShowForm(false); setLabName(''); setTestName(''); load();
    } finally { setSubmitting(false); }
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-sm font-bold text-foreground"><FlaskConical className="h-4 w-4 text-cyan-600" /> Lab Tests</h3>
          <Button size="sm" onClick={() => setShowForm(v => !v)} className="min-h-9 gap-1 rounded-xl">{showForm ? <X className="h-3.5" /> : <Plus className="h-3.5" />} {showForm ? 'Close' : 'Book'}</Button>
        </div>
        <AnimatePresence>{showForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-3 space-y-2 rounded-xl border border-border bg-muted/30 p-3">
              <div><Label className="text-xs font-semibold">Lab *</Label><Select value={labName} onValueChange={setLabName}><SelectTrigger className="mt-1 h-10 rounded-xl"><SelectValue placeholder="Select lab" /></SelectTrigger><SelectContent>{data?.partnerLabs?.map(l => <SelectItem key={l.name} value={l.name}>{l.name}</SelectItem>)}</SelectContent></Select></div>
              <div><Label className="text-xs font-semibold">Test *</Label><Select value={testName} onValueChange={setTestName}><SelectTrigger className="mt-1 h-10 rounded-xl"><SelectValue placeholder="Select test" /></SelectTrigger><SelectContent>{data?.commonTests?.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
              <Button onClick={submit} disabled={submitting} className="min-h-10 w-full gap-1.5 rounded-xl">{submitting ? <Loader2 className="h-4 animate-spin" /> : <FlaskConical className="h-4" />} Request test</Button>
            </div>
          </motion.div>
        )}</AnimatePresence>
        {loading ? <div className="mt-2 h-16 animate-pulse rounded-xl bg-muted/30" /> : data?.tests?.length ? (
          <ul className="mt-2 space-y-1.5">
            {data.tests.slice(0, 5).map(t => (
              <li key={t.id} className="flex items-center gap-2 rounded-lg border border-border bg-background p-2 text-xs">
                <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate font-semibold text-foreground">{t.testName}</span>
                <span className="text-muted-foreground">{t.labName}</span>
                <Badge className={cn('text-[9px]', t.status === 'completed' ? 'bg-emerald-500/15 text-emerald-700' : t.status === 'requested' ? 'bg-amber-500/15 text-amber-700' : 'bg-muted text-muted-foreground')}>{t.status}</Badge>
              </li>
            ))}
          </ul>
        ) : <p className="mt-2 text-center text-xs text-muted-foreground">No lab tests booked yet.</p>}
      </CardContent>
    </Card>
  );
}
