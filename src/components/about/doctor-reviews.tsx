'use client';
import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Loader2, ThumbsUp, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Review { id: string; rating: number; comment: string | null; patientName: string; createdAt: string; }
interface DoctorReviewsProps { doctorProfileId: string; doctorName: string; }

export function DoctorReviews({ doctorProfileId, doctorName }: DoctorReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [myRating, setMyRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [myComment, setMyComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => { setLoading(true); try { const r = await fetch(`/api/doctors/reviews?doctorProfileId=${doctorProfileId}`, { cache: 'no-store' }); if (r.ok) { const d = await r.json(); setReviews(d.reviews ?? []); setAvgRating(d.avgRating ?? 0); setCount(d.count ?? 0); } } catch {} finally { setLoading(false); } }, [doctorProfileId]);
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (myRating < 1 || myRating > 5) return toast.error('Select a rating (1-5 stars).');
    setSubmitting(true);
    try { const r = await fetch('/api/doctors/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ doctorProfileId, rating: myRating, comment: myComment || undefined }) });
      if (!r.ok) return toast.error('Failed to submit review.');
      toast.success('Review submitted!'); setShowForm(false); setMyRating(0); setMyComment(''); load();
    } finally { setSubmitting(false); }
  };

  const distribution = [5,4,3,2,1].map(s => ({ stars: s, count: reviews.filter(r => r.rating === s).length, pct: count > 0 ? (reviews.filter(r => r.rating === s).length / count) * 100 : 0 }));

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div><h3 className="flex items-center gap-1.5 text-sm font-bold text-foreground"><Star className="h-4 w-4 text-amber-500" /> Patient Reviews</h3><p className="text-xs text-muted-foreground">Reviews for {doctorName}.</p></div>
        <Button size="sm" variant="outline" onClick={() => setShowForm(v => !v)} className="min-h-9 shrink-0 gap-1 rounded-xl">{showForm ? <X className="h-3.5" /> : <Star className="h-3.5" />} {showForm ? 'Cancel' : 'Write'}</Button>
      </div>
      {count > 0 && (<div className="flex items-center gap-4 rounded-xl border border-border bg-muted/30 p-3"><div className="text-center"><p className="text-3xl font-black text-foreground">{avgRating.toFixed(1)}</p><div className="mt-0.5 flex justify-center gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} className={cn('h-3 w-3', s <= Math.round(avgRating) ? 'fill-amber-500 text-amber-500' : 'fill-muted text-muted-foreground/30')} />)}</div><p className="mt-0.5 text-[10px] text-muted-foreground">{count} review{count !== 1 ? 's' : ''}</p></div><div className="flex-1 space-y-1">{distribution.map(d => <div key={d.stars} className="flex items-center gap-2 text-[10px]"><span className="w-6 text-muted-foreground">{d.stars}★</span><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${d.pct}%` }} /></div><span className="w-6 text-right text-muted-foreground">{d.count}</span></div>)}</div></div>)}
      <AnimatePresence>{showForm && (<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden"><Card className="border-primary/20 bg-primary/5"><CardContent className="space-y-3 p-4"><div><p className="mb-1.5 text-xs font-semibold">Your rating:</p><div className="flex gap-1">{[1,2,3,4,5].map(s => <button key={s} onClick={() => setMyRating(s)} onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)} className="p-0.5 transition-transform hover:scale-110" aria-label={`${s} star${s !== 1 ? 's' : ''}`}><Star className={cn('h-7 w-7 transition-colors', s <= (hoverRating || myRating) ? 'fill-amber-500 text-amber-500' : 'fill-muted text-muted-foreground/40')} /></button>)}</div></div><div><p className="mb-1.5 text-xs font-semibold">Comment (optional):</p><Textarea value={myComment} onChange={e => setMyComment(e.target.value)} rows={3} maxLength={500} placeholder="Share your experience…" className="rounded-xl text-sm" /><p className="mt-0.5 text-right text-[10px] text-muted-foreground">{myComment.length}/500</p></div><Button onClick={submit} disabled={submitting || myRating === 0} className="min-h-10 w-full gap-1.5 rounded-xl">{submitting ? <Loader2 className="h-4 animate-spin" /> : <ThumbsUp className="h-4" />} Submit review</Button></CardContent></Card></motion.div>)}</AnimatePresence>
      {loading ? <div className="space-y-2">{[0,1].map(i => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted/30" />)}</div> : reviews.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-center"><Star className="mx-auto mb-1.5 h-6 w-6 text-muted-foreground/40" /><p className="text-xs text-muted-foreground">No reviews yet. Be the first!</p></div>
      ) : (
        <ul className="space-y-2">{reviews.slice(0, 5).map((r, i) => (<motion.li key={r.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}><Card className="shadow-sm"><CardContent className="p-3"><div className="flex items-start gap-2.5"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-[10px] font-bold text-primary">{r.patientName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}</span><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="text-xs font-bold text-foreground">{r.patientName}</p><div className="flex gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} className={cn('h-2.5 w-2.5', s <= r.rating ? 'fill-amber-500 text-amber-500' : 'fill-muted text-muted-foreground/30')} />)}</div></div>{r.comment && <p className="mt-1 text-xs leading-relaxed text-foreground/80">{r.comment}</p>}<p className="mt-1 text-[10px] text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</p></div></div></CardContent></Card></motion.li>))}</ul>
      )}
    </div>
  );
}
