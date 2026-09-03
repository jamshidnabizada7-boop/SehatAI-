'use client';
import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarPlus, Loader2, Clock, CheckCircle2, XCircle, X, MapPin, Stethoscope, Video } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { VideoCall } from '@/components/video/video-call';
import { toast } from 'sonner';

interface Appointment { id: string; doctorProfileId: string; doctorName: string; doctorSpecialty: string; doctorFacilityName: string | null; doctorFacilityCity: string | null; scheduledAt: string; reason: string | null; status: string; doctorNotes: string | null; createdAt: string; }
interface Doctor { id: string; name: string; specialty: string; facilityName: string | null; facilityCity: string | null; pmdcNumber: string; }
const STATUS_CFG: Record<string, { label: string; color: string }> = { requested: { label: 'Requested', color: 'bg-amber-500/15 text-amber-700' }, confirmed: { label: 'Confirmed', color: 'bg-emerald-500/15 text-emerald-700' }, declined: { label: 'Declined', color: 'bg-red-500/15 text-red-700' }, cancelled: { label: 'Cancelled', color: 'bg-muted text-muted-foreground' }, completed: { label: 'Completed', color: 'bg-primary/15 text-primary' } };

export function AppointmentManager() {
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const [videoCallId, setVideoCallId] = useState<string | null>(null);

  const load = useCallback(async () => { setLoading(true); try { const r = await fetch('/api/appointments', { cache: 'no-store' }); if (r.ok) setAppts((await r.json()).appointments ?? []); } catch {} finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);

  const openModal = async () => { setShowModal(true); if (doctors.length === 0) { try { const r = await fetch('/api/doctors'); if (r.ok) setDoctors((await r.json()).doctors ?? []); } catch {} } };
  const submit = async () => {
    if (!selectedDoctor || !scheduledAt) return toast.error('Select a doctor and date/time.');
    setSubmitting(true);
    try { const r = await fetch('/api/appointments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ doctorProfileId: selectedDoctor, scheduledAt: new Date(scheduledAt).toISOString(), reason: reason || undefined }) });
      if (!r.ok) return toast.error('Failed to book.');
      toast.success('Appointment requested!'); setShowModal(false); setSelectedDoctor(''); setReason(''); load();
    } finally { setSubmitting(false); }
  };
  const cancel = async (id: string) => { setActing(id); try { const r = await fetch('/api/appointments', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action: 'cancel' }) }); if (r.ok) { toast.success('Cancelled.'); load(); } } finally { setActing(null); } };

  const upcoming = appts.filter(a => ['requested', 'confirmed'].includes(a.status));
  const defaultDate = (() => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(10, 0, 0, 0); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); })();

  return (
    <Card className="shadow-sm"><CardContent className="p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10"><CalendarPlus className="h-5 w-5 text-primary" /></span><div><h3 className="text-sm font-bold text-foreground">Appointments</h3><p className="text-xs text-muted-foreground">Book a visit with a verified doctor.</p></div></div>
        <Button size="sm" onClick={openModal} className="min-h-9 gap-1 rounded-xl"><CalendarPlus className="h-3.5" /> Book</Button>
      </div>
      {loading ? <div className="space-y-2">{[0,1].map(i => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted/30" />)}</div> : upcoming.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-center"><CalendarPlus className="mx-auto mb-1.5 h-6 w-6 text-muted-foreground/40" /><p className="text-xs text-muted-foreground">No appointments yet. Click "Book" to schedule.</p></div>
      ) : (
        <ul className="space-y-2">{upcoming.map(a => { const cfg = STATUS_CFG[a.status] ?? STATUS_CFG.requested; return (
          <li key={a.id} className="rounded-xl border border-border bg-background p-3">
            <div className="flex items-start gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10"><Stethoscope className="h-4 w-4 text-primary" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2"><p className="text-sm font-bold text-foreground">{a.doctorName}</p><Badge className={cn('gap-0.5 text-[9px] font-bold', cfg.color)}>{cfg.label}</Badge></div>
                <p className="text-xs text-muted-foreground">{a.doctorSpecialty}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground"><span className="inline-flex items-center gap-0.5"><Clock className="h-3 w-3" /> {new Date(a.scheduledAt).toLocaleString()}</span>{a.doctorFacilityName && <span className="inline-flex items-center gap-0.5"><MapPin className="h-3 w-3" /> {a.doctorFacilityName}{a.doctorFacilityCity ? `, ${a.doctorFacilityCity}` : ''}</span>}</div>
                {a.reason && <p className="mt-1 text-xs italic text-muted-foreground">"{a.reason}"</p>}
                {a.doctorNotes && <p className="mt-1 rounded-lg bg-muted/40 p-1.5 text-[10px] text-foreground/80"><span className="font-bold">Doctor's note:</span> {a.doctorNotes}</p>}
                {['requested', 'confirmed'].includes(a.status) && <div className="mt-2 flex gap-1.5">
                  {a.status === 'confirmed' && <Button size="sm" onClick={() => setVideoCallId(a.id)} className="min-h-8 gap-1 bg-emerald-600 text-[10px] text-white hover:bg-emerald-700"><Video className="h-3 w-3" /> Join Call</Button>}
                  <Button size="sm" variant="outline" onClick={() => cancel(a.id)} disabled={acting === a.id} className="min-h-8 gap-1 border-red-500/30 text-[10px] text-red-700 hover:bg-red-500/5">{acting === a.id ? <Loader2 className="h-3 animate-spin" /> : <X className="h-3" />} Cancel</Button>
                </div>}
              </div>
            </div>
          </li>
        );})}</ul>
      )}
      <AnimatePresence>{showModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} onClick={e => e.stopPropagation()} className="max-h-[90vh] w-full max-w-md overflow-y-auto custom-scrollbar rounded-2xl bg-card p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10"><CalendarPlus className="h-4 w-4 text-primary" /></span><h3 className="text-sm font-bold">Book an appointment</h3></div><button onClick={() => setShowModal(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent"><X className="h-4 w-4" /></button></div>
            <div className="space-y-3">
              <div><label className="mb-1 block text-xs font-semibold">Doctor *</label><div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-border bg-muted/20 p-2">{doctors.map(d => <button key={d.id} onClick={() => setSelectedDoctor(d.id)} className={cn('flex w-full items-center gap-2 rounded-lg border p-2 text-left', selectedDoctor === d.id ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-accent/50')}><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-[10px] font-bold text-primary">{d.name.split(' ').map(w => w[0]).slice(0, 2).join('')}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{d.name}</p><p className="truncate text-[10px] text-muted-foreground">{d.specialty} · {d.pmdcNumber}</p></div>{selectedDoctor === d.id && <CheckCircle2 className="h-4 w-4 text-primary" />}</button>)}</div></div>
              <div><label className="mb-1 block text-xs font-semibold">Date & time *</label><Input type="datetime-local" value={scheduledAt || defaultDate} onChange={e => setScheduledAt(e.target.value)} className="h-10 rounded-xl" /></div>
              <div><label className="mb-1 block text-xs font-semibold">Reason (optional)</label><Textarea rows={2} value={reason} onChange={e => setReason(e.target.value)} maxLength={500} placeholder="e.g. Follow-up for BP check" className="rounded-xl text-sm" /></div>
              <Button onClick={submit} disabled={submitting || !selectedDoctor} className="min-h-10 w-full gap-1.5 rounded-xl">{submitting ? <Loader2 className="h-4 animate-spin" /> : <CalendarPlus className="h-4" />} Request appointment</Button>
            </div>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>

      {/* Video Call Modal */}
      <AnimatePresence>
        {videoCallId && (
          <VideoCall appointmentId={videoCallId} onClose={() => setVideoCallId(null)} />
        )}
      </AnimatePresence>
    </CardContent></Card>
  );
}
