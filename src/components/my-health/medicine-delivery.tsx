'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pill, Loader2, Plus, X, Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Order { id: string; pharmacyName: string; items: { name: string; quantity: number }[]; status: string; createdAt: string; }
interface Pharmacy { name: string; cities: string[]; deliveryTime: string; }

export function MedicineDelivery() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [pharmacy, setPharmacy] = useState('');
  const [medName, setMedName] = useState('');
  const [medQty, setMedQty] = useState('1');
  const [items, setItems] = useState<{ name: string; quantity: number }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await fetch('/api/medicine-orders', { cache: 'no-store' }); if (r.ok) { const d = await r.json(); setOrders(d.orders); setPharmacies(d.partnerPharmacies); } } catch {}
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const addItem = () => { if (!medName.trim()) return; setItems(prev => [...prev, { name: medName.trim(), quantity: parseInt(medQty) || 1 }]); setMedName(''); setMedQty('1'); };
  const submit = async () => {
    if (!pharmacy || items.length === 0) return toast.error('Select a pharmacy and add at least one medicine.');
    setSubmitting(true);
    try { const r = await fetch('/api/medicine-orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pharmacyName: pharmacy, items }) });
      if (!r.ok) return toast.error('Failed to place order.');
      toast.success('Medicine order placed!'); setShowForm(false); setItems([]); setPharmacy(''); load();
    } finally { setSubmitting(false); }
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-sm font-bold text-foreground"><Pill className="h-4 w-4 text-emerald-600" /> Medicine Delivery</h3>
          <Button size="sm" onClick={() => setShowForm(v => !v)} className="min-h-9 gap-1 rounded-xl">{showForm ? <X className="h-3.5" /> : <Plus className="h-3.5" />} {showForm ? 'Close' : 'Order'}</Button>
        </div>
        <AnimatePresence>{showForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-3 space-y-2 rounded-xl border border-border bg-muted/30 p-3">
              <div><Label className="text-xs font-semibold">Pharmacy *</Label><Select value={pharmacy} onValueChange={setPharmacy}><SelectTrigger className="mt-1 h-10 rounded-xl"><SelectValue placeholder="Select pharmacy" /></SelectTrigger><SelectContent>{pharmacies.map(p => <SelectItem key={p.name} value={p.name}>{p.name} ({p.deliveryTime})</SelectItem>)}</SelectContent></Select></div>
              <div className="flex gap-1.5">
                <Input value={medName} onChange={e => setMedName(e.target.value)} placeholder="Medicine name" className="h-9 rounded-xl text-xs flex-1" onKeyDown={e => e.key === 'Enter' && addItem()} />
                <Input type="number" min="1" value={medQty} onChange={e => setMedQty(e.target.value)} className="h-9 w-16 rounded-xl text-xs" />
                <Button size="sm" onClick={addItem} className="min-h-9 rounded-xl px-3"><Plus className="h-3.5" /></Button>
              </div>
              {items.length > 0 && <ul className="space-y-1">{items.map((it, i) => <li key={i} className="flex items-center gap-2 text-xs"><span className="flex-1">{it.name}</span><span className="text-muted-foreground">×{it.quantity}</span><button onClick={() => setItems(prev => prev.filter((_, j) => j !== i))} className="text-red-500"><X className="h-3 w-3" /></button></li>)}</ul>}
              <Button onClick={submit} disabled={submitting || items.length === 0} className="min-h-10 w-full gap-1.5 rounded-xl">{submitting ? <Loader2 className="h-4 animate-spin" /> : <Package className="h-4" />} Place order</Button>
            </div>
          </motion.div>
        )}</AnimatePresence>
        {loading ? <div className="mt-2 h-16 animate-pulse rounded-xl bg-muted/30" /> : orders.length > 0 ? (
          <ul className="mt-2 space-y-1.5">
            {orders.slice(0, 5).map(o => (
              <li key={o.id} className="flex items-center gap-2 rounded-lg border border-border bg-background p-2 text-xs">
                <Package className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate font-semibold text-foreground">{o.items.length} item(s)</span>
                <span className="text-muted-foreground">{o.pharmacyName}</span>
                <Badge className={cn('text-[9px]', o.status === 'delivered' ? 'bg-emerald-500/15 text-emerald-700' : o.status === 'placed' ? 'bg-amber-500/15 text-amber-700' : 'bg-muted text-muted-foreground')}>{o.status}</Badge>
              </li>
            ))}
          </ul>
        ) : <p className="mt-2 text-center text-xs text-muted-foreground">No medicine orders yet.</p>}
      </CardContent>
    </Card>
  );
}
