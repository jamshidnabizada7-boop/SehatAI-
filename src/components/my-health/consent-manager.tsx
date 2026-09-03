'use client';
import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ShieldOff, Loader2, Plus, X, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Consent { id: string; doctorProfileId: string; doctorName: string; pmdcNumber: string; specialty: string; facilityName: string | null; facilityCity: string | null; scope: string; grantedAt: string; revokedAt: string | null; isActive: boolean; }
interface Doctor { id: string; name: string; specialty: string; facilityName: string | null; facilityCity: string | null; pmdcNumber: string; }
const SCOPE_LABELS: Record<string, string> = { read_history: 'Read chat history', soap_draft: 'Generate SOAP notes', follow_up: 'Schedule follow-ups' };

export function ConsentManager() {
  const [consents, setConsents] = useState<Consent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [results, setResults] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedScope, setSelectedScope] = useState('read_history');
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => { setLoading(true); try { const r = await fetch('/api/user/consents', { cache: 'no-store' }); if (r.ok) setConsents((await r.json()).consents ?? []); } catch {} finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);

  useEffect(() => { if (!searchQ.trim()) { setResults([]); return; } const t = setTimeout(async () => { try { const r = await fetch(`/api/doctors?q=${encodeURIComponent(searchQ)}`); if (r.ok) setResults((await r.json()).doctors ?? []); } catch {} }, 300); return () => clearTimeout(t); }, [searchQ]);

  const grant = async () => {
    if (!selectedDoctor) return toast.error('Select a doctor first.');
    setActing('grant');
    try { const r = await fetch('/api/user/consents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ doctorProfileId: selectedDoctor, scope: selectedScope, action: 'grant' }) });
      if (!r.ok) return toast.error('Failed to grant consent.');
      toast.success('Access granted!'); setSearchOpen(false); setSelectedDoctor(''); setSearchQ(''); load();
    } finally { setActing(null); }
  };
  const revoke = async (c: Consent) => { setActing(c.id); try { const r = await fetch('/api/user/consents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ doctorProfileId: c.doctorProfileId, scope: c.scope, action: 'revoke' }) });
      if (r.ok) { toast.success('Access revoked.'); load(); } } finally { setActing(null); } };

  const active = consents.filter(c => c.isActive);
  return (
    <Card className="shadow-sm"><CardContent className="p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15"><ShieldCheck className="h-5 w-5 text-emerald-600" /></span><div><h3 className="text-sm font-bold text-foreground">Doctor Access</h3><p className="text-xs text-muted-foreground">Control which doctors can see your data.</p></div></div>
        <Button size="sm" variant="outline" onClick={() => setSearchOpen(v => !v)} className="min-h-9 gap-1 rounded-xl">{searchOpen ? <X className="h-3.5" /> : <Plus className="h-3.5" />} {searchOpen ? 'Close' : 'Grant'}</Button>
      </div>
      <AnimatePresence>{searchOpen && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
          <div className="mb-3 space-y-2 rounded-xl border border-border bg-muted/30 p-3">
            <Input type="search" value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search doctors…" className="h-10 rounded-xl" />
            {results.length > 0 && <div className="max-h-40 space-y-1 overflow-y-auto">{results.slice(0, 6).map(d => <button key={d.id} onClick={() => setSelectedDoctor(d.id)} className={cn('flex w-full items-center gap-2 rounded-lg border p-2 text-left transition-colors', selectedDoctor === d.id ? 'border-emerald-500 bg-emerald-500/5' : 'border-border hover:bg-accent/50')}><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-[10px] font-bold text-emerald-700">{d.name.split(' ').map(w => w[0]).slice(0, 2).join('')}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{d.name}</p><p className="truncate text-[10px] text-muted-foreground">{d.specialty} · {d.pmdcNumber}</p></div>{selectedDoctor === d.id && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}</button>)}</div>}
            <Select value={selectedScope} onValueChange={setSelectedScope}><SelectTrigger className="h-10 rounded-xl text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="read_history">Read chat history</SelectItem><SelectItem value="soap_draft">Generate SOAP notes</SelectItem><SelectItem value="follow_up">Schedule follow-ups</SelectItem></SelectContent></Select>
            <Button onClick={grant} disabled={!selectedDoctor || acting === 'grant'} className="min-h-10 w-full gap-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700">{acting === 'grant' ? <Loader2 className="h-4 animate-spin" /> : <ShieldCheck className="h-4" />} Grant access</Button>
          </div>
        </motion.div>
      )}</AnimatePresence>
      {loading ? <div className="space-y-2">{[0,1].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted/30" />)}</div> : active.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-center"><ShieldOff className="mx-auto mb-1.5 h-6 w-6 text-muted-foreground/40" /><p className="text-xs text-muted-foreground">No doctors have access. Click "Grant" to share.</p></div>
      ) : (
        <ul className="space-y-2">{active.map(c => (
          <li key={c.id} className="rounded-xl border border-emerald-500/20 bg-emerald-50/30 p-3 dark:bg-emerald-950/10">
            <div className="flex items-start gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15"><ShieldCheck className="h-4 w-4 text-emerald-600" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2"><p className="text-sm font-bold text-foreground">{c.doctorName}</p><Badge className="bg-emerald-500/10 text-[9px] font-bold text-emerald-700">{c.pmdcNumber}</Badge></div>
                <p className="text-xs text-muted-foreground">{c.specialty}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground"><span className="inline-flex items-center gap-0.5"><ShieldCheck className="h-3 w-3" /> {SCOPE_LABELS[c.scope] ?? c.scope}</span><span>· Granted {new Date(c.grantedAt).toLocaleDateString()}</span></div>
              </div>
              <Button size="sm" variant="outline" onClick={() => revoke(c)} disabled={acting === c.id} className="min-h-8 shrink-0 gap-1 border-red-500/30 text-[10px] text-red-700 hover:bg-red-500/5 dark:text-red-400">{acting === c.id ? <Loader2 className="h-3 animate-spin" /> : <ShieldOff className="h-3" />} Revoke</Button>
            </div>
          </li>
        ))}</ul>
      )}
    </CardContent></Card>
  );
}
