'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Loader2, Plus, X, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Claim { id: string; provider: string; claimType: string; amount: number; status: string; createdAt: string; }
interface Provider { name: string; coverage: Record<string, number>; }

const CLAIM_TYPES = [{ value: 'consultation', label: 'Doctor Consultation' }, { value: 'lab-test', label: 'Lab Test' }, { value: 'medicine', label: 'Medicine' }, { value: 'procedure', label: 'Procedure' }];

export function InsuranceClaims() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [provider, setProvider] = useState('');
  const [claimType, setClaimType] = useState('consultation');
  const [amount, setAmount] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [coveragePreview, setCoveragePreview] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await fetch('/api/insurance-claims', { cache: 'no-store' }); if (r.ok) { const d = await r.json(); setClaims(d.claims); setProviders(d.providers); } } catch {}
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const p = providers.find(p => p.name === provider);
    if (p) setCoveragePreview(p.coverage[claimType as keyof typeof p.coverage] ?? 0);
    else setCoveragePreview(null);
  }, [provider, claimType, providers]);

  const submit = async () => {
    if (!provider || !amount) return toast.error('Select provider and enter amount.');
    setSubmitting(true);
    try { const r = await fetch('/api/insurance-claims', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider, claimType, amount: parseInt(amount), policyNumber: policyNumber || undefined }) });
      if (!r.ok) return toast.error('Failed to submit claim.');
      const d = await r.json();
      toast.success(`Claim submitted! Expected reimbursement: PKR ${d.expectedReimbursement} (${d.coveragePercent}%)`);
      setShowForm(false); setProvider(''); setAmount(''); setPolicyNumber(''); load();
    } finally { setSubmitting(false); }
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-sm font-bold text-foreground"><Shield className="h-4 w-4 text-blue-600" /> Insurance</h3>
          <Button size="sm" onClick={() => setShowForm(v => !v)} className="min-h-9 gap-1 rounded-xl">{showForm ? <X className="h-3.5" /> : <Plus className="h-3.5" />} {showForm ? 'Close' : 'Claim'}</Button>
        </div>
        <AnimatePresence>{showForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-3 space-y-2 rounded-xl border border-border bg-muted/30 p-3">
              <div><Label className="text-xs font-semibold">Provider *</Label><Select value={provider} onValueChange={setProvider}><SelectTrigger className="mt-1 h-10 rounded-xl"><SelectValue placeholder="Select insurance" /></SelectTrigger><SelectContent>{providers.map(p => <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs font-semibold">Type *</Label><Select value={claimType} onValueChange={setClaimType}><SelectTrigger className="mt-1 h-10 rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{CLAIM_TYPES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></div>
                <div><Label className="text-xs font-semibold">Amount (PKR) *</Label><Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="5000" className="mt-1 h-10 rounded-xl" /></div>
              </div>
              <Input value={policyNumber} onChange={e => setPolicyNumber(e.target.value)} placeholder="Policy number (optional)" className="h-9 rounded-xl text-xs" />
              {coveragePreview !== null && <div className="rounded-lg bg-blue-500/10 p-2 text-xs text-blue-700 dark:text-blue-400"><span className="font-bold">{coveragePreview}%</span> coverage · Expected reimbursement: PKR {Math.round((parseInt(amount) || 0) * coveragePreview / 100)}</div>}
              <Button onClick={submit} disabled={submitting} className="min-h-10 w-full gap-1.5 rounded-xl">{submitting ? <Loader2 className="h-4 animate-spin" /> : <FileText className="h-4" />} Submit claim</Button>
            </div>
          </motion.div>
        )}</AnimatePresence>
        {loading ? <div className="mt-2 h-16 animate-pulse rounded-xl bg-muted/30" /> : claims.length > 0 ? (
          <ul className="mt-2 space-y-1.5">
            {claims.slice(0, 5).map(c => (
              <li key={c.id} className="flex items-center gap-2 rounded-lg border border-border bg-background p-2 text-xs">
                <Shield className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                <span className="flex-1 truncate font-semibold text-foreground">{c.provider}</span>
                <span className="text-muted-foreground">PKR {c.amount}</span>
                <Badge className={cn('text-[9px]', c.status === 'approved' || c.status === 'reimbursed' ? 'bg-emerald-500/15 text-emerald-700' : c.status === 'rejected' ? 'bg-red-500/15 text-red-700' : 'bg-amber-500/15 text-amber-700')}>{c.status}</Badge>
              </li>
            ))}
          </ul>
        ) : <p className="mt-2 text-center text-xs text-muted-foreground">No insurance claims yet.</p>}
      </CardContent>
    </Card>
  );
}
