'use client';

// ============================================================
// Care Connect §8 — consultation workspace (patient + doctor).
// One component, role-aware:
//  - secure messaging (SSE realtime, §21/§25) with corrections
//  - translation with original preserved + risk confirmation (§34/§35)
//  - join call (signed token, low-bandwidth fallback, §26/§28)
//  - doctor: AI handoff review (§31), private notes (§42),
//    SOAP draft, prescription builder with safety checks (§39/§40)
//  - patient: view patient summary, prescription, review (§44), refund (§49)
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/lib/store/app-store';
import { resolveUiLang, t } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { formatMoney } from '@/lib/care/money';
import { cn } from '@/lib/utils';
import { Phone, Video, MessageSquare, CheckCheck, CheckCircle2, Languages, ShieldAlert, FileText, Star, Undo2, CreditCard, Mic, MicOff, VideoOff, PhoneOff, Loader2, Stethoscope, Pill, CalendarClock, Check } from 'lucide-react';

export interface ConsultationDetail {
  id: string;
  type: 'TEXT' | 'AUDIO' | 'VIDEO';
  status: string;
  priceMinor: number | null;
  currency: string | null;
  scheduledAt: string | null;
  windowClosesAt: string | null;
  doctor: { id: string; name: string; specialty: string };
  patient: { id: string; name: string };
  payment: { status: string; amountMinor: number; currency: string } | null;
  handoff: { status: string; content: string | null; label: string | null } | null;
  notes: Array<{ id: string; type: string; visibility: string; content: string }>;
  prescriptions: Array<{ id: string; status: string; issuedAt: string | null; items: Array<{ medicine: string; strength?: string | null; frequency?: string | null; durationDays?: number | null; instructions?: string | null }> }>;
  review: { overall: number; comment: string | null } | null;
  viewerRole: 'PATIENT' | 'DOCTOR' | 'STAFF';
  canMessage: boolean;
}
export interface ChatMsg {
  id: string;
  senderRole: string;
  senderName: string;
  kind: string;
  body: string;
  language: string;
  correctedById?: string | null;
  translations?: Array<{ id: string; translatedText: string; targetLanguage: string; needsConfirmation: boolean }>;
  createdAt: string;
}

export function ConsultationWorkspace({ consultationId, onBack }: { consultationId: string; onBack: () => void }) {
  const langPref = useAppStore((s) => s.langPref);
  const uiLang = resolveUiLang(langPref);
  const T = useCallback((key: Parameters<typeof t>[1]) => t(uiLang, key), [uiLang]);

  const [detail, setDetail] = useState<ConsultationDetail | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTranslate, setShowTranslate] = useState<Record<string, boolean>>({});
  const [activeCall, setActiveCall] = useState<ActiveCallData | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isDoctor = detail?.viewerRole === 'DOCTOR';
  const isPatient = detail?.viewerRole === 'PATIENT';

  // §27/§28 — WebRTC join-call event listener
  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<ActiveCallData>;
      if (customEvent.detail) {
        setActiveCall(customEvent.detail);
      }
    };
    window.addEventListener('care:join-call', handler);
    return () => window.removeEventListener('care:join-call', handler);
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/care/consultations/${consultationId}`);
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? 'ERROR'); return; }
      setDetail(json.consultation);
      const msgsRes = await fetch(`/api/care/consultations/${consultationId}/messages`);
      const msgsJson = await msgsRes.json();
      setMessages(msgsJson.messages ?? []);
    } catch {
      setError('NETWORK');
    }
  }, [consultationId]);

  useEffect(() => { void load(); }, [load]);

  // §25 — realtime stream
  useEffect(() => {
    if (!detail) return;
    const es = new EventSource(`/api/care/consultations/${consultationId}/messages/stream`);
    es.onmessage = (ev) => {
      try {
        const event = JSON.parse(ev.data) as { kind: string };
        if (event.kind === 'message') {
          void fetch(`/api/care/consultations/${consultationId}/messages`)
            .then((r) => r.json())
            .then((j) => setMessages(j.messages ?? []));
        }
      } catch { /* ignore malformed */ }
    };
    return () => es.close();
  }, [consultationId, detail]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function action(payload: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/care/consultations/${consultationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) setError(json.error ?? 'ERROR');
      await load();
    } catch {
      setError('NETWORK');
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    if (!draft.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/care/consultations/${consultationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: draft }),
      });
      const json = await res.json();
      if (!res.ok) setError(json.error ?? 'ERROR');
      else setDraft('');
      const msgsRes = await fetch(`/api/care/consultations/${consultationId}/messages`);
      setMessages((await msgsRes.json()).messages ?? []);
    } finally {
      setBusy(false);
    }
  }

  async function translate(messageId: string) {
    try {
      const res = await fetch(`/api/care/consultations/${consultationId}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, targetLanguage: isDoctor ? 'en' : uiLang === 'ur' ? 'en' : 'ur' }),
      });
      const json = await res.json();
      if (res.ok) {
        setMessages((msgs) => msgs.map((m) => (m.id === messageId ? { ...m, translations: [...(m.translations ?? []), json.translation] } : m)));
        setShowTranslate((s) => ({ ...s, [messageId]: true }));
      } else setError(json.error ?? 'ERROR');
    } catch { setError('NETWORK'); }
  }

  async function confirmTranslation(translationId: string) {
    await fetch(`/api/care/consultations/${consultationId}/translate`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ translationId }),
    });
    setShowTranslate((s) => ({ ...s, [translationId]: true }));
  }

  async function joinCall() {
    try {
      const res = await fetch(`/api/care/consultations/${consultationId}/join`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? 'ERROR'); return; }
      setActiveCall(json);
      window.dispatchEvent(new CustomEvent('care:join-call', { detail: json }));
      setError(null);
    } catch { setError('NETWORK'); }
  }

  async function handlePay() {
    setBusy(true);
    setError(null);
    try {
      const idemKey = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `pay-${Date.now()}`;
      const res = await fetch('/api/care/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idemKey,
        },
        body: JSON.stringify({ consultationId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'PAYMENT_FAILED');
        return;
      }

      // In development / mock provider: feed signed webhook confirm (§100)
      const isMock =
        json.payment?.provider === 'mock' ||
        json.provider?.toLowerCase().includes('mock') ||
        json.provider?.toLowerCase().includes('test') ||
        (json.checkoutUrl && (json.checkoutUrl.startsWith('/') || json.checkoutUrl.includes('mock_payment')));
      if (isMock && json.payment?.id) {
        const confirmRes = await fetch('/api/care/payments/mock/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId: json.payment.id, outcome: 'succeeded' }),
        });
        if (confirmRes.ok) {
          await load();
          return;
        } else {
          const cJson = await confirmRes.json().catch(() => ({}));
          setError(cJson.error ?? 'MOCK_CONFIRM_FAILED');
          return;
        }
      }

      // In production with real provider: redirect to hosted checkoutUrl (§57)
      if (json.checkoutUrl) {
        window.location.href = json.checkoutUrl;
      } else {
        await load();
      }
    } catch {
      setError('NETWORK');
    } finally {
      setBusy(false);
    }
  }

  async function requestRefund() {
    setBusy(true);
    try {
      const res = await fetch('/api/care/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consultationId, reason: 'patient_cancelled' }),
      });
      const json = await res.json();
      if (!res.ok) setError(json.error ?? 'ERROR');
      await load();
    } finally { setBusy(false); }
  }

  async function submitReview(rating: number) {
    setBusy(true);
    try {
      await fetch(`/api/care/consultations/${consultationId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overall: rating }),
      });
      await load();
    } finally { setBusy(false); }
  }

  if (!detail) {
    return <div className="p-6 text-sm text-muted-foreground">{error ?? 'Loading…'}</div>;
  }

  const statusColors: Record<string, string> = {
    COMPLETED: 'bg-green-100 text-green-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    WAITING: 'bg-amber-100 text-amber-800',
    REQUESTED: 'bg-amber-100 text-amber-800',
    SCHEDULED: 'bg-blue-100 text-blue-800',
    PAYMENT_PENDING: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-wrap items-center gap-2 border-b p-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="min-h-11" aria-label="back">
          <Undo2 className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">
            {isDoctor ? detail.patient.name : detail.doctor.name}
            <span className="text-muted-foreground"> · {detail.doctor.specialty}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {detail.type} · {formatMoney({ amountMinor: detail.priceMinor ?? 0, currency: detail.currency ?? 'PKR' })}
            {detail.payment ? ` · payment: ${detail.payment.status}` : ''}
          </div>
        </div>
        <Badge className={cn('text-2xs', statusColors[detail.status])}>{detail.status}</Badge>
        {isPatient && detail.status === 'PAYMENT_PENDING' && (!detail.payment || detail.payment.status !== 'PAID') ? (
          <Button size="sm" className="min-h-11 font-semibold" disabled={busy} onClick={() => void handlePay()}>
            <CreditCard className="me-1 h-4 w-4" />
            {T('care.payAndBook')}
          </Button>
        ) : null}
        {detail.type !== 'TEXT' && detail.status !== 'PAYMENT_PENDING' ? (
          <Button size="sm" className="min-h-11" onClick={() => void joinCall()}>
            {detail.type === 'VIDEO' ? <Video className="me-1 h-4 w-4" /> : <Phone className="me-1 h-4 w-4" />}
            {T('care.joinCall')}
          </Button>
        ) : null}
      </header>

      {error ? <p role="alert" className="bg-destructive/10 p-2 text-center text-xs text-destructive">{error}</p> : null}

      {/* §10 — Patient payment prompt banner */}
      {isPatient && detail.status === 'PAYMENT_PENDING' && (!detail.payment || detail.payment.status !== 'PAID') ? (
        <Card className="mx-3 mt-3 border-amber-300 bg-amber-50/60 dark:bg-amber-950/20">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-200">{T('care.paymentPending')}</p>
              <p className="text-xs text-muted-foreground">
                {formatMoney({ amountMinor: detail.priceMinor ?? 0, currency: detail.currency ?? 'PKR' })}
              </p>
            </div>
            <Button disabled={busy} onClick={() => void handlePay()} className="min-h-11 font-semibold">
              <CreditCard className="me-1 h-4 w-4" />
              {T('care.payAndBook')}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Doctor tools: AI handoff + notes + prescriptions */}
      {isDoctor ? <DoctorTools consultationId={consultationId} detail={detail} T={T} onChanged={load} /> : null}

      {/* Patient tools: prescription + summary view */}
      {isPatient && detail.prescriptions.length > 0 ? (
        <Card className="mx-3 mt-3 border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <FileText className="h-4 w-4 text-primary" /> {T('care.prescription')}
              </div>
              <Badge variant="outline" className="text-2xs font-semibold border-emerald-600/40 text-emerald-700 dark:text-emerald-400 gap-1">
                <CheckCircle2 className="h-3 w-3" /> PM&amp;DC Verified
              </Badge>
            </div>
            {detail.prescriptions.map((p) => (
              <div key={p.id} className="text-xs">
                {p.items.map((item, i) => (
                  <div key={i} className="text-muted-foreground">
                    {item.medicine} {item.strength ?? ''} {item.frequency ?? ''} {item.durationDays ? `· ${item.durationDays}d` : ''}
                  </div>
                ))}
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="outline" className="text-2xs">{p.status}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {/* §21 secure messages */}
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <ul className="flex flex-col gap-2" aria-label={T('care.consultation')}>
          {messages.map((m) => {
            const mine = (isDoctor && m.senderRole === 'DOCTOR') || (isPatient && m.senderRole === 'PATIENT') || m.senderRole === 'SYSTEM';
            return (
              <li key={m.id} className={cn('max-w-[85%]', mine ? 'self-end' : 'self-start')}>
                <div className={cn('rounded-2xl px-3 py-2 text-sm', m.senderRole === 'SYSTEM' ? 'bg-muted text-muted-foreground text-xs' : mine ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                  {m.kind === 'correction' ? '✏️ ' : ''}{m.body}
                </div>
                {m.senderRole !== 'SYSTEM' ? (
                  <div className="mt-0.5 flex items-center gap-2 text-2xs text-muted-foreground">
                    <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {m.correctedById ? <span className="italic">corrected</span> : null}
                    <button
                      type="button"
                      className="inline-flex items-center gap-0.5 hover:underline"
                      onClick={() => void translate(m.id)}
                    >
                      <Languages className="h-3 w-3" /> {T('care.translate')}
                    </button>
                    {(m.translations ?? []).map((tr) => (
                      <span key={tr.id} className="inline-flex items-center gap-1 rounded bg-accent px-1">
                        {showTranslate[tr.id] ? m.body : tr.translatedText}
                        {tr.needsConfirmation ? (
                          <button type="button" className="text-amber-600 hover:underline" onClick={() => void confirmTranslation(tr.id)} title={T('care.confirmTranslation')}>
                            <ShieldAlert className="h-3 w-3 inline" /> ✓
                          </button>
                        ) : null}
                      </span>
                    ))}
                  </div>
                ) : null}
              </li>
            );
          })}
          <div ref={bottomRef} />
        </ul>
      </div>

      {/* composer / window state */}
      {detail.canMessage ? (
        <footer className="flex items-center gap-2 border-t p-3">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); } }}
            placeholder={T('care.messagePlaceholder')}
            className="min-h-11"
            disabled={busy}
          />
          <Button onClick={() => void send()} disabled={busy || !draft.trim()} className="min-h-11">
            <MessageSquare className="me-1 h-4 w-4" />{T('care.sendMessage')}
          </Button>
        </footer>
      ) : (
        <footer className="border-t p-3 text-center text-xs text-muted-foreground">{T('care.windowClosed')}</footer>
      )}

      {/* lifecycle actions */}
      <footer className="flex flex-wrap gap-2 border-t p-3">
        {isDoctor && ['REQUESTED'].includes(detail.status) ? (
          <>
            <Button size="sm" className="min-h-11" disabled={busy} onClick={() => void action({ action: 'accept' })}>{T('care.accept')}</Button>
            <Button size="sm" variant="outline" className="min-h-11" disabled={busy} onClick={() => void action({ action: 'decline' })}>{T('care.decline')}</Button>
          </>
        ) : null}
        {isDoctor && ['WAITING', 'SCHEDULED'].includes(detail.status) ? (
          <Button size="sm" className="min-h-11" disabled={busy} onClick={() => void action({ action: 'complete' })}>{T('care.completeConsultation')}</Button>
        ) : null}
        {isPatient && detail.status === 'PAYMENT_PENDING' && (!detail.payment || detail.payment.status !== 'PAID') ? (
          <Button size="sm" className="min-h-11 font-semibold" disabled={busy} onClick={() => void handlePay()}>
            <CreditCard className="me-1 h-4 w-4" />
            {T('care.payAndBook')}
          </Button>
        ) : null}
        {isPatient && ['PAYMENT_PENDING', 'PAID', 'REQUESTED', 'SCHEDULED', 'WAITING'].includes(detail.status) ? (
          <Button size="sm" variant="outline" className="min-h-11" disabled={busy} onClick={() => void action({ action: 'cancel', reason: 'patient_cancelled' })}>{T('care.cancel')}</Button>
        ) : null}
        {isPatient && detail.status === 'COMPLETED' && !detail.review ? (
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">{T('care.rateConsultation')}:</span>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => void submitReview(n)} aria-label={`${n} stars`} className="min-h-11 px-1">
                <Star className={cn('h-5 w-5', n <= 4 ? 'text-amber-500' : 'text-amber-500')} />
              </button>
            ))}
          </div>
        ) : null}
        {isPatient && detail.review ? (
          <Badge variant="secondary"><CheckCheck className="me-1 h-3 w-3" />{detail.review.overall}★</Badge>
        ) : null}
        {isPatient && ['PAYMENT_PENDING', 'PAID', 'REQUESTED', 'SCHEDULED', 'WAITING', 'COMPLETED'].includes(detail.status) ? (
          <Button size="sm" variant="ghost" className="min-h-11" disabled={busy} onClick={() => void requestRefund()}>{T('care.requestRefund')}</Button>
        ) : null}
      </footer>

      {activeCall ? (
        <CareCallModal
          call={activeCall}
          consultationId={consultationId}
          initialType={detail.type}
          onClose={() => setActiveCall(null)}
          T={T}
        />
      ) : null}
    </div>
  );
}

// ------------------------------------------------------------
// Doctor clinical tools: AI handoff review + private notes + Rx builder
// ------------------------------------------------------------
function DoctorTools({ consultationId, detail, T, onChanged }: {
  consultationId: string;
  detail: ConsultationDetail;
  T: (key: Parameters<typeof t>[1]) => string;
  onChanged: () => Promise<void>;
}) {
  const [tab, setTab] = useState<'handoff' | 'note' | 'rx' | null>(null);
  const [handoff, setHandoff] = useState<{ status: string; label: string; content: Record<string, unknown> } | null>(null);
  const [note, setNote] = useState('');
  const [noteVisibility, setNoteVisibility] = useState<'PRIVATE_NOTE' | 'PATIENT_SUMMARY'>('PRIVATE_NOTE');
  const [rxItems, setRxItems] = useState<Array<{ medicine: string; strength: string; frequency: string; durationDays: number }>>([{ medicine: '', strength: '', frequency: '', durationDays: 5 }]);
  const [safety, setSafety] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);

  const loadHandoff = useCallback(async () => {
    const res = await fetch(`/api/care/consultations/${consultationId}/handoff`);
    const json = await res.json();
    if (res.ok) setHandoff(json.handoff);
  }, [consultationId]);

  useEffect(() => {
    if (tab === 'handoff' && !handoff) void loadHandoff();
  }, [tab, handoff, loadHandoff]);

  async function handoffAction(action: 'ACCEPT' | 'EDIT' | 'REJECT') {
    setBusy(true);
    try {
      await fetch(`/api/care/consultations/${consultationId}/handoff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      await loadHandoff();
      await onChanged();
    } finally { setBusy(false); }
  }

  async function saveNote() {
    setBusy(true);
    try {
      await fetch(`/api/care/consultations/${consultationId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'SOAP', visibility: noteVisibility, content: note }),
      });
      setNote('');
      await onChanged();
    } finally { setBusy(false); }
  }

  async function draftRx() {
    setBusy(true);
    try {
      const res = await fetch(`/api/care/consultations/${consultationId}/prescriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: rxItems.filter((i) => i.medicine.trim()) }),
      });
      const json = await res.json();
      setSafety(res.ok ? json.safety : { error: json.error });
      await onChanged();
    } finally { setBusy(false); }
  }

  async function signRx(prescriptionId: string, needsOverride: boolean) {
    setBusy(true);
    try {
      let overrideReason: string | undefined;
      if (needsOverride) {
        overrideReason = window.prompt('HIGH-severity warnings — document the reason for overriding (logged):') ?? undefined;
        if (!overrideReason) return;
      }
      const res = await fetch(`/api/care/consultations/${consultationId}/prescriptions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sign', prescriptionId, overrideReason }),
      });
      const json = await res.json();
      if (!res.ok) window.alert(json.error);
      await onChanged();
    } finally { setBusy(false); }
  }

  return (
    <div className="border-b p-2">
      <div className="flex gap-1">
        <Button size="sm" variant={tab === 'handoff' ? 'default' : 'outline'} className="min-h-11" onClick={() => setTab(tab === 'handoff' ? null : 'handoff')}>🤖 {T('care.aiHandoff')}</Button>
        <Button size="sm" variant={tab === 'note' ? 'default' : 'outline'} className="min-h-11" onClick={() => setTab(tab === 'note' ? null : 'note')}>📝 {T('care.clinicalNote')}</Button>
        <Button size="sm" variant={tab === 'rx' ? 'default' : 'outline'} className="min-h-11" onClick={() => setTab(tab === 'rx' ? null : 'rx')}><Pill className="h-4 w-4" aria-hidden />{T('care.prescription')}</Button>
      </div>

      {tab === 'handoff' && handoff ? (
        <Card className="mt-2">
          <CardContent className="p-3 text-xs">
            <Badge variant="outline" className="mb-2 border-amber-500 text-amber-600">{handoff.label}</Badge>
            <pre className="whitespace-pre-wrap rounded bg-muted/50 p-2 text-2xs">{JSON.stringify(handoff.content, null, 2)}</pre>
            <div className="mt-2 flex gap-1">
              <Button size="sm" className="min-h-11" disabled={busy} onClick={() => void handoffAction('ACCEPT')}>{T('care.acceptHandoff')}</Button>
              <Button size="sm" variant="outline" className="min-h-11" disabled={busy} onClick={() => void handoffAction('EDIT')}>{T('care.editHandoff')}</Button>
              <Button size="sm" variant="ghost" className="min-h-11" disabled={busy} onClick={() => void handoffAction('REJECT')}>{T('care.decline')}</Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {tab === 'note' ? (
        <Card className="mt-2">
          <CardContent className="p-3">
            <div className="mb-1 flex items-center gap-2 text-xs">
              <select
                value={noteVisibility}
                onChange={(e) => setNoteVisibility(e.target.value as 'PRIVATE_NOTE' | 'PATIENT_SUMMARY')}
                className="rounded border bg-background p-1 text-xs"
                aria-label="note visibility"
              >
                <option value="PRIVATE_NOTE">{T('care.clinicalNote')}</option>
                <option value="PATIENT_SUMMARY">{T('care.patientSummary')}</option>
              </select>
            </div>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="text-xs" placeholder="S / O / A / P…" />
            <Button size="sm" className="mt-2 min-h-11" disabled={busy || !note.trim()} onClick={() => void saveNote()}>Save {T('care.summary')}</Button>
            {detail.notes.length > 0 ? (
              <ul className="mt-2 flex flex-col gap-1 text-2xs text-muted-foreground">
                {detail.notes.map((n) => (
                  <li key={n.id} className="rounded bg-muted/50 p-1">
                    <b>{n.visibility === 'PRIVATE_NOTE' ? '🔒' : '👁'} {n.type}</b>: {n.content.slice(0, 160)}
                  </li>
                ))}
              </ul>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {tab === 'rx' ? (
        <Card className="mt-2">
          <CardContent className="p-3 text-xs">
            {rxItems.map((item, i) => (
              <div key={i} className="mb-2 grid grid-cols-4 gap-1">
                <Input value={item.medicine} onChange={(e) => setRxItems((arr) => arr.map((x, j) => (j === i ? { ...x, medicine: e.target.value } : x)))} placeholder="medicine" className="min-h-11 text-xs" />
                <Input value={item.strength} onChange={(e) => setRxItems((arr) => arr.map((x, j) => (j === i ? { ...x, strength: e.target.value } : x)))} placeholder="500 mg" className="min-h-11 text-xs" />
                <Input value={item.frequency} onChange={(e) => setRxItems((arr) => arr.map((x, j) => (j === i ? { ...x, frequency: e.target.value } : x)))} placeholder="2x/day" className="min-h-11 text-xs" />
                <Input type="number" value={item.durationDays} onChange={(e) => setRxItems((arr) => arr.map((x, j) => (j === i ? { ...x, durationDays: Number(e.target.value) } : x)))} placeholder="days" className="min-h-11 text-xs" />
              </div>
            ))}
            <div className="flex gap-1">
              <Button size="sm" variant="outline" className="min-h-11" disabled={busy} onClick={() => setRxItems((a) => [...a, { medicine: '', strength: '', frequency: '', durationDays: 5 }])}>+ item</Button>
              <Button size="sm" className="min-h-11" disabled={busy} onClick={() => void draftRx()}>{T('care.safetyCheck')}</Button>
            </div>
            {safety ? (
              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded bg-muted/50 p-2 text-2xs">{JSON.stringify(safety, null, 2)}</pre>
            ) : null}
            {detail.prescriptions.filter((p) => p.status === 'DRAFT').map((p) => (
              <Button key={p.id} size="sm" className="mt-2 min-h-11" disabled={busy} onClick={() => void signRx(p.id, JSON.stringify(safety ?? {}).includes('"HIGH"'))}>
                ✍️ {T('care.signPrescription')}
              </Button>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

// ============================================================
// Care Connect §27/§28 — WebRTC video/audio call modal
// Reuses the WebRTC signaling protocol (mini-services/video-signal)
// with full fallback ladder: VIDEO → AUDIO → TEXT.
// ============================================================
export interface ActiveCallData {
  callId: string;
  roomId: string;
  provider?: string;
  token?: string;
  expiresAt?: string;
  signalingUrl?: string | null;
  iceServers?: Array<{ urls: string }>;
  recording?: boolean;
}

function CareCallModal({
  call,
  consultationId,
  initialType,
  onClose,
  T,
}: {
  call: ActiveCallData;
  consultationId: string;
  initialType: 'AUDIO' | 'VIDEO' | 'TEXT';
  onClose: () => void;
  T: (key: Parameters<typeof t>[1]) => string;
}) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const disconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const roomRef = useRef<any>(null);

  const [mode, setMode] = useState<'VIDEO' | 'AUDIO'>(initialType === 'AUDIO' ? 'AUDIO' : 'VIDEO');
  const [status, setStatus] = useState<'connecting' | 'waiting' | 'connected' | 'fell_back' | 'ended'>('connecting');
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(initialType !== 'AUDIO');
  const [remoteVideoMuted, setRemoteVideoMuted] = useState(false);
  const [statusText, setStatusText] = useState('Connecting…');

  const modeRef = useRef(mode);
  modeRef.current = mode;

  const cleanup = useCallback(() => {
    if (disconnectTimerRef.current) {
      clearTimeout(disconnectTimerRef.current);
      disconnectTimerRef.current = null;
    }
    if (roomRef.current) {
      if (typeof window !== 'undefined' && (window as any).__liveKitRoom === roomRef.current) {
        (window as any).__liveKitRoom = null;
      }
      try {
        roomRef.current.disconnect();
      } catch { /* ignore */ }
      roomRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (wsRef.current) {
      try {
        wsRef.current.send(JSON.stringify({ type: 'leave', room: call.roomId }));
      } catch { /* ignore */ }
      wsRef.current.close();
      wsRef.current = null;
    }
  }, [call.roomId]);

  const reportState = useCallback(async (state: 'ACTIVE' | 'ENDED' | 'FAILED' | 'FELL_BACK', fallbackTo?: 'AUDIO' | 'TEXT', reason?: string) => {
    try {
      await fetch(`/api/care/consultations/${consultationId}/calls`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId: call.callId,
          state,
          fallbackTo,
          reason,
        }),
      });
    } catch { /* best effort */ }
  }, [call.callId, consultationId]);

  const handleLeave = useCallback(async () => {
    if (roomRef.current) {
      try {
        await roomRef.current.disconnect();
      } catch { /* ignore */ }
      roomRef.current = null;
    }
    cleanup();
    setStatus('ended');
    await reportState('ENDED');
    onClose();
  }, [cleanup, reportState, onClose]);

  const handleFallbackToAudio = useCallback(async () => {
    setMode('AUDIO');
    setCamOn(false);
    if (roomRef.current) {
      try {
        await roomRef.current.localParticipant.setCameraEnabled(false);
      } catch { /* ignore */ }
    }
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t) => {
        t.enabled = false;
        t.stop();
      });
    }
    setStatus('fell_back');
    setStatusText('Switched to audio-only connection (fallback)');
    await reportState('FELL_BACK', 'AUDIO', 'bandwidth_or_connection_failure');
  }, [reportState]);

  const handleFallbackToText = useCallback(async () => {
    if (roomRef.current) {
      try {
        await roomRef.current.disconnect();
      } catch { /* ignore */ }
      roomRef.current = null;
    }
    cleanup();
    await reportState('FELL_BACK', 'TEXT', 'call_unreachable');
    onClose();
  }, [cleanup, reportState, onClose]);

  const createPeerConnection = useCallback((stream: MediaStream) => {
    const iceServers = call.iceServers && call.iceServers.length > 0
      ? call.iceServers
      : [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }];

    const pc = new RTCPeerConnection({ iceServers });

    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ice', candidate: event.candidate }));
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = event.streams[0];
      }
      setStatus('connected');
      setStatusText('Connected');
      if (disconnectTimerRef.current) {
        clearTimeout(disconnectTimerRef.current);
        disconnectTimerRef.current = null;
      }
      void reportState('ACTIVE');
    };

    pc.onconnectionstatechange = () => {
      const s = pc.connectionState;
      if (s === 'connected') {
        setStatus('connected');
        setStatusText('Connected');
        if (disconnectTimerRef.current) {
          clearTimeout(disconnectTimerRef.current);
          disconnectTimerRef.current = null;
        }
      } else if (s === 'disconnected') {
        setStatusText('Reconnecting…');
        if (!disconnectTimerRef.current) {
          disconnectTimerRef.current = setTimeout(() => {
            if (modeRef.current === 'VIDEO') {
              void handleFallbackToAudio();
            } else {
              void handleFallbackToText();
            }
          }, 5000);
        }
      } else if (s === 'failed') {
        setStatusText('Connection failed');
        if (modeRef.current === 'VIDEO') {
          void handleFallbackToAudio();
        } else {
          void handleFallbackToText();
        }
      }
    };

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    return pc;
  }, [call.iceServers, handleFallbackToAudio, handleFallbackToText, reportState]);

  useEffect(() => {
    let active = true;
    const initialMode = initialType === 'AUDIO' ? 'AUDIO' : 'VIDEO';

    async function start() {
      // ------------------------------------------------------------
      // 1. LIVEKIT CLOUD / MANAGED SFU INTEGRATION
      // Triggered when CARE_VIDEO_PROVIDER=livekit on server.
      // Room token contains HS256 JWT with short-lived TTL and room claim.
      // ------------------------------------------------------------
      if (call.provider === 'livekit' && call.signalingUrl && call.token) {
        try {
          const { Room, RoomEvent, Track } = await import('livekit-client');
          if (!active) return;

          const room = new Room({
            adaptiveStream: true,
            dynacast: true,
            // Configure ICE from the server before creating transports. Embedded
            // browsers can reject the V1 offer-with-join setConfiguration update.
            singlePeerConnection: false,
          });
          roomRef.current = room;
          if (typeof window !== 'undefined') {
            (window as any).__liveKitRoom = room;
          }

          // Wire remote media tracks
          room.on(RoomEvent.TrackSubscribed, (track: any) => {
            if (track.kind === Track.Kind.Video && remoteVideoRef.current) {
              track.attach(remoteVideoRef.current);
              setRemoteVideoMuted(false);
            } else if (track.kind === Track.Kind.Audio && remoteAudioRef.current) {
              track.attach(remoteAudioRef.current);
            }
            setStatus('connected');
            setStatusText('Connected');
            void reportState('ACTIVE');
          });

          room.on(RoomEvent.TrackUnsubscribed, (track: any) => {
            track.detach();
          });

          room.on(RoomEvent.TrackMuted, (pub: any) => {
            if (pub.kind === Track.Kind.Video) {
              setRemoteVideoMuted(true);
            }
          });

          room.on(RoomEvent.TrackUnmuted, (pub: any) => {
            if (pub.kind === Track.Kind.Video) {
              setRemoteVideoMuted(false);
              if (remoteVideoRef.current && pub.track) {
                pub.track.attach(remoteVideoRef.current);
              }
            }
          });

          room.on(RoomEvent.ParticipantConnected, () => {
            setStatus('connected');
            setStatusText('Connected');
            void reportState('ACTIVE');
          });

          room.on(RoomEvent.ParticipantDisconnected, () => {
            if (room.remoteParticipants.size === 0) {
              setStatus('waiting');
              setStatusText('Other participant left the call');
              if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
              if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
            }
          });

          room.on(RoomEvent.LocalTrackPublished, (pub: any) => {
            if (pub.track && pub.source === Track.Source.Camera && localVideoRef.current) {
              pub.track.attach(localVideoRef.current);
            }
          });

          room.on(RoomEvent.LocalTrackUnpublished, (pub: any) => {
            if (pub.source === Track.Source.Camera && localVideoRef.current) {
              localVideoRef.current.srcObject = null;
            }
          });

          room.on(RoomEvent.Reconnecting, () => {
            setStatusText('Reconnecting…');
          });

          room.on(RoomEvent.Reconnected, () => {
            setStatus('connected');
            setStatusText('Connected');
          });

          room.on(RoomEvent.Disconnected, (reason?: any) => {
            if (active && status !== 'ended') {
              const r = String(reason || '').toLowerCase();
              if (r.includes('token') || r.includes('expired') || r.includes('auth') || r.includes('unauthorized')) {
                setStatusText('Room token expired. Please re-join the consultation.');
              } else {
                setStatusText('Call ended');
              }
            }
          });

          setStatus('connecting');
          setStatusText('Connecting to LiveKit SFU…');
          await room.connect(call.signalingUrl, call.token);
          if (!active) {
            await room.disconnect();
            return;
          }

          // Publish local tracks
          if (initialMode === 'VIDEO') {
            await room.localParticipant.enableCameraAndMicrophone();
            const camPub = room.localParticipant.getTrackPublication(Track.Source.Camera);
            if (camPub?.videoTrack && localVideoRef.current) {
              camPub.videoTrack.attach(localVideoRef.current);
            }
          } else {
            await room.localParticipant.setMicrophoneEnabled(true);
          }

          if (room.remoteParticipants.size > 0) {
            room.remoteParticipants.forEach((p: any) => {
              p.trackPublications.forEach((pub: any) => {
                if (pub.track) {
                  if (pub.track.kind === Track.Kind.Video && remoteVideoRef.current) {
                    pub.track.attach(remoteVideoRef.current);
                    setRemoteVideoMuted(false);
                  } else if (pub.track.kind === Track.Kind.Audio && remoteAudioRef.current) {
                    pub.track.attach(remoteAudioRef.current);
                  }
                }
              });
            });
            setStatus('connected');
            setStatusText('Connected');
            void reportState('ACTIVE');
          } else {
            setStatus('waiting');
            setStatusText('Waiting for other participant…');
          }
          // A successful managed call must never start the local relay too.
          return;
        } catch (err: any) {
          if (!active) return;
          console.warn('[LiveKit] SFU connection failed:', err);
          if (roomRef.current) {
            try { await roomRef.current.disconnect(); } catch {}
            roomRef.current = null;
          }
          const msg = String(err?.message || '').toLowerCase();
          if (msg.includes('expired') || msg.includes('unauthorized') || msg.includes('jwt') || msg.includes('401')) {
            setStatusText('Room token expired or unauthorized. Please re-join the consultation.');
            setStatus('ended');
            void reportState('FAILED', undefined, 'livekit_token_unauthorized');
            return;
          }
          // A managed SFU URL is not a local signaling relay. Keep the error
          // visible and offer rejoin or secure chat instead of inventing a relay.
          setStatusText(msg.includes('permission') || msg.includes('notallowed')
            ? 'Allow camera and microphone in your browser, then rejoin.'
            : 'Could not connect to the call. Rejoin or continue in secure chat.');
          setStatus('ended');
          void reportState('FAILED', undefined, 'livekit_connection_failed');
          return;
        }
      }

      // ------------------------------------------------------------
      // 2. LOCAL WEBRTC SIGNALING RELAY (DEVELOPMENT FALLBACK)
      // mini-services/video-signal on port 3004
      // ------------------------------------------------------------
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: initialMode === 'VIDEO' ? { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } : false,
          audio: true,
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        if (localVideoRef.current && initialMode === 'VIDEO') {
          localVideoRef.current.srcObject = stream;
        }

        const wsUrl = (call.signalingUrl && !call.signalingUrl.includes('livekit'))
          ? call.signalingUrl
          : (typeof window !== 'undefined'
              ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:3004`
              : 'ws://localhost:3004');

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          ws.send(JSON.stringify({ type: 'join', room: call.roomId }));
          setStatus('waiting');
          setStatusText('Waiting for other participant…');
        };

        ws.onmessage = async (event) => {
          try {
            const msg = JSON.parse(event.data);
            switch (msg.type) {
              case 'room-full': {
                if (!pcRef.current) {
                  const pc = createPeerConnection(stream);
                  pcRef.current = pc;
                  const offer = await pc.createOffer();
                  await pc.setLocalDescription(offer);
                  ws.send(JSON.stringify({ type: 'offer', sdp: offer }));
                }
                break;
              }
              case 'peer-joined':
                break;
              case 'offer': {
                if (!pcRef.current) {
                  const pc = createPeerConnection(stream);
                  pcRef.current = pc;
                }
                await pcRef.current.setRemoteDescription(new RTCSessionDescription(msg.sdp));
                const answer = await pcRef.current.createAnswer();
                await pcRef.current.setLocalDescription(answer);
                ws.send(JSON.stringify({ type: 'answer', sdp: answer }));
                break;
              }
              case 'answer': {
                if (pcRef.current) {
                  await pcRef.current.setRemoteDescription(new RTCSessionDescription(msg.sdp));
                }
                break;
              }
              case 'ice': {
                if (pcRef.current && msg.candidate) {
                  await pcRef.current.addIceCandidate(new RTCIceCandidate(msg.candidate)).catch(() => {});
                }
                break;
              }
              case 'peer-left':
              case 'leave': {
                setStatus('waiting');
                setStatusText('Other participant left the call');
                if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
                if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
                break;
              }
            }
          } catch { /* ignore parse error */ }
        };

        ws.onerror = () => {
          setStatusText('Signaling connection error');
        };
      } catch (_err) {
        setStatusText('Could not access microphone or camera');
      }
    }

    void start();

    return () => {
      active = false;
      cleanup();
    };
  }, [call.roomId, call.signalingUrl, call.provider, call.token, initialType, createPeerConnection, cleanup]);

  function toggleMic() {
    const next = !micOn;
    if (roomRef.current) {
      void roomRef.current.localParticipant.setMicrophoneEnabled(next);
    }
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = next;
      });
    }
    setMicOn(next);
  }

  function toggleCam() {
    const next = !camOn;
    if (roomRef.current) {
      void roomRef.current.localParticipant.setCameraEnabled(next).then((pub: any) => {
        if (next && localVideoRef.current) {
          const track = pub?.videoTrack ?? roomRef.current?.localParticipant.getTrackPublication('camera' as any)?.videoTrack;
          if (track) track.attach(localVideoRef.current);
        } else if (!next && localVideoRef.current) {
          localVideoRef.current.srcObject = null;
        }
      });
    }
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t) => {
        t.enabled = next;
      });
    }
    setCamOn(next);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-6" role="dialog" aria-modal="true" aria-label="Telemedicine call">
      <div className="relative flex flex-col h-[94vh] w-full max-w-6xl overflow-hidden rounded-2xl bg-background text-foreground border border-border shadow-2xl">
        {/* Top Meta Strip (§ references/03_Video_Consultation.png) */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 px-5 py-3 bg-card/60">
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Live Consultation with Dr. Ayesha Malik
            </h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span className="chip green text-2xs">● Live demo</span>
              <span>Room: {call.roomId.slice(0, 16)} · LiveKit SFU design reference</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="chip green text-2xs">Connection: {status === 'connected' ? 'stable' : 'demo'}</span>
            <span className="chip stroke text-2xs">08:42</span>
            <span className="chip stroke text-2xs">Private session</span>
            <Button variant="destructive" size="sm" onClick={() => void handleLeave()} className="h-8 rounded-xl font-bold text-xs ms-2">
              <PhoneOff className="me-1 h-3.5 w-3.5" /> End Call
            </Button>
          </div>
        </header>

        {/* 60/40 Split Video Stage + Clinical Notes */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-y-auto">
          {/* Left Column: 60% Video Stage (lg:col-span-7) */}
          <div className="lg:col-span-7 flex flex-col bg-neutral-950 p-4 justify-between border-e border-border/80 relative">
            <div className="relative flex-1 min-h-[380px] sm:min-h-[460px] rounded-2xl overflow-hidden bg-black flex items-center justify-center">
              <audio ref={remoteAudioRef} data-testid="remote-audio" autoPlay playsInline className="sr-only" aria-hidden="true" />
              {/* Remote video stream or fallback photo */}
              <video ref={remoteVideoRef} data-testid="remote-video" autoPlay playsInline className="h-full w-full object-cover" />
              {/* Photo placeholder if video stream is not active or in sample mode */}
              <img
                src="/assets/video_call_photo.jpg"
                alt="Doctor video stream"
                className={cn(
                  'absolute inset-0 h-full w-full object-cover pointer-events-none',
                  remoteVideoRef.current?.srcObject && 'opacity-0'
                )}
              />
              {/* Floating PiP Self View */}
              <video
                ref={localVideoRef}
                data-testid="local-video"
                autoPlay
                playsInline
                muted
                className={cn(
                  'absolute bottom-4 right-4 h-28 w-36 rounded-xl border-2 border-neutral-700 object-cover shadow-xl z-20',
                  !camOn && 'hidden'
                )}
              />

              {/* Floating Bottom Circular Controls Dock */}
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2.5 bg-neutral-950/85 backdrop-blur-md px-4 py-2.5 rounded-full border border-neutral-700/80 shadow-2xl z-30">
                <button
                  type="button"
                  onClick={toggleMic}
                  className={cn(
                    'h-10 w-10 rounded-full flex items-center justify-center transition-all',
                    micOn ? 'bg-neutral-800 text-white hover:bg-neutral-700' : 'bg-red-600 text-white hover:bg-red-700'
                  )}
                  title={micOn ? 'Mute' : 'Unmute'}
                >
                  {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={toggleCam}
                  className={cn(
                    'h-10 w-10 rounded-full flex items-center justify-center transition-all',
                    camOn ? 'bg-neutral-800 text-white hover:bg-neutral-700' : 'bg-red-600 text-white hover:bg-red-700'
                  )}
                  title={camOn ? 'Stop Camera' : 'Start Camera'}
                >
                  {camOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => void handleFallbackToAudio()}
                  className="h-10 w-10 rounded-full bg-neutral-800 text-white hover:bg-neutral-700 flex items-center justify-center"
                  title="Audio fallback"
                >
                  <Phone className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => void handleLeave()}
                  className="h-10 w-10 rounded-full bg-red-600 text-white hover:bg-red-700 flex items-center justify-center shadow-md"
                  title="End Call"
                >
                  <PhoneOff className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Doctor Profile Footer strip below video */}
            <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-neutral-800 text-white">
              <div className="flex items-center gap-3">
                <img
                  src="/assets/doctor_ayesha.png"
                  alt="Dr. Ayesha Malik"
                  className="h-12 w-12 rounded-xl object-cover border border-neutral-700"
                />
                <div>
                  <b className="text-sm block">Dr. Ayesha Malik</b>
                  <span className="text-xs text-neutral-400">Cardiologist · Example profile</span>
                </div>
              </div>
              <span className="chip orange text-2xs">Illustrative clinician</span>
            </div>
          </div>

          {/* Right Column: 40% Tabbed Clinical Notes (lg:col-span-5) */}
          <div className="lg:col-span-5 flex flex-col p-5 space-y-4 bg-background overflow-y-auto custom-scrollbar">
            {/* 4 Mini Tabs */}
            <div className="flex items-center gap-1.5 border-b border-border/80 pb-2 text-xs">
              {['Clinical Notes', 'Patient Info', 'Chat', 'Resources'].map((t, idx) => (
                <button
                  key={t}
                  type="button"
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-bold transition-colors',
                    idx === 0 ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Visit Summary */}
            <div className="inset inset-green p-3.5 rounded-xl border border-emerald-200/60 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-xs text-primary">
                <FileText className="h-4 w-4" />
                <span>Visit Summary</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Patient reports mild dry cough and fever for two days. This is synthetic sample data, not a clinical record.
              </p>
            </div>

            {/* Assessment / Provisional Diagnosis */}
            <div className="surface pad p-3.5 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-xs text-primary">
                <Stethoscope className="h-4 w-4" />
                <span>Assessment / Provisional Diagnosis</span>
              </div>
              <p className="text-xs text-foreground/85 leading-relaxed">
                Possible viral upper respiratory tract infection. Clinical examination and auscultation are required for formal diagnosis.
              </p>
            </div>

            {/* E-Prescription */}
            <div className="surface pad p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs text-primary">
                  <Pill className="h-4 w-4" />
                  <span>E-Prescription</span>
                </div>
                <span className="chip stroke text-2xs">+ Add Medication</span>
              </div>
              <div className="inset inset-green p-2.5 rounded-lg border border-emerald-200">
                <b className="text-xs text-foreground block">Paracetamol 500mg</b>
                <span className="text-2xs text-muted-foreground">Illustrative chart only — requires clinician authorization.</span>
              </div>
              <p className="text-2xs text-muted-foreground">
                Prescriptions are not generated automatically by this demonstration.
              </p>
            </div>

            {/* Care Plan / Follow-up */}
            <div className="surface pad p-3.5 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs text-primary">
                <CalendarClock className="h-4 w-4" />
                <span>Care Plan / Follow-up</span>
              </div>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                {[
                  'Rest and maintain hydration',
                  'Monitor symptoms and temperature',
                  'Seek urgent care for severe warning signs',
                  'Arrange follow-up if symptoms persist',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <Check className="mt-px h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom 2 insets */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="inset inset-blue p-2.5 rounded-lg text-2xs">
                <b>Telehealth Compliance</b>
                <p className="text-muted-foreground mt-0.5">Requires jurisdiction-specific legal review.</p>
              </div>
              <div className="inset inset-green p-2.5 rounded-lg text-2xs">
                <b>Technical Support</b>
                <p className="text-muted-foreground mt-0.5">Troubleshoot network or audio issues.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
