'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Loader2, Plus, X, ArrowUp, Reply } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Post { id: string; title: string; content: string; category: string; upvotes: number; replies: number; authorName: string; isPinned: boolean; createdAt: string; }
const CATEGORIES = ['general', 'maternal', 'child-health', 'chronic', 'mental-health'];

export function CommunityForum() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await fetch('/api/community', { cache: 'no-store' }); if (r.ok) { const d = await r.json(); setPosts(d.posts); } } catch {}
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!title.trim() || !content.trim()) return toast.error('Title and content are required.');
    setSubmitting(true);
    try { const r = await fetch('/api/community', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, content, category }) });
      if (!r.ok) return toast.error('Failed to post.');
      toast.success('Posted to community!'); setShowForm(false); setTitle(''); setContent(''); load();
    } finally { setSubmitting(false); }
  };

  const submitReply = async (postId: string) => {
    if (!replyText.trim()) return;
    try { const r = await fetch('/api/community', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId, reply: true, content: replyText }) });
      if (r.ok) { toast.success('Reply posted!'); setReplyText(''); setExpandedId(null); load(); }
    } catch {}
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div><h3 className="flex items-center gap-1.5 text-sm font-bold text-foreground"><MessageSquare className="h-4 w-4 text-primary" /> Community Forum</h3><p className="text-xs text-muted-foreground">Ask questions, share experiences.</p></div>
        <Button size="sm" onClick={() => setShowForm(v => !v)} className="min-h-9 gap-1 rounded-xl">{showForm ? <X className="h-3.5" /> : <Plus className="h-3.5" />} {showForm ? 'Close' : 'Post'}</Button>
      </div>
      <AnimatePresence>{showForm && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
          <Card className="border-primary/20 bg-primary/5"><CardContent className="space-y-2 p-3">
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Post title" className="h-9 rounded-xl text-sm" />
            <Textarea value={content} onChange={e => setContent(e.target.value)} rows={3} placeholder="Share your question or experience…" className="rounded-xl text-sm" />
            <div className="flex gap-2"><Select value={category} onValueChange={setCategory}><SelectTrigger className="h-9 w-40 rounded-xl text-xs"><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select><Button onClick={submit} disabled={submitting} className="min-h-9 flex-1 gap-1 rounded-xl">{submitting ? <Loader2 className="h-4 animate-spin" /> : <Plus className="h-4" />} Post</Button></div>
          </CardContent></Card>
        </motion.div>
      )}</AnimatePresence>
      {loading ? <div className="space-y-2">{[0,1,2].map(i => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted/30" />)}</div> : posts.length === 0 ? (
        <Card className="border-dashed"><CardContent className="p-6 text-center"><MessageSquare className="mx-auto mb-1.5 h-8 w-8 text-muted-foreground/40" /><p className="text-sm text-muted-foreground">No posts yet. Be the first!</p></CardContent></Card>
      ) : (
        <ul className="space-y-2">
          {posts.map(p => (
            <li key={p.id} className="rounded-xl border border-border bg-card p-3 shadow-sm">
              <div className="flex items-start gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-[10px] font-bold text-primary">{p.authorName?.[0]?.toUpperCase() ?? 'A'}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><p className="text-sm font-bold text-foreground">{p.title}</p>{p.isPinned && <Badge className="bg-amber-500/15 text-[8px] text-amber-700">📌 Pinned</Badge>}</div>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">{p.content}</p>
                  <div className="mt-1.5 flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span>{p.authorName}</span><span>·</span><span>{new Date(p.createdAt).toLocaleDateString()}</span>
                    <Badge variant="secondary" className="text-[8px]">{p.category}</Badge>
                    <button onClick={() => setExpandedId(expandedId === p.id ? null : p.id)} className="ml-auto inline-flex items-center gap-0.5 font-semibold text-primary hover:underline"><Reply className="h-3 w-3" /> {p.replies}</button>
                  </div>
                </div>
              </div>
              <AnimatePresence>{expandedId === p.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="mt-2 flex gap-1.5 border-t border-border pt-2">
                    <Input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Write a reply…" className="h-8 flex-1 rounded-lg text-xs" onKeyDown={e => e.key === 'Enter' && submitReply(p.id)} />
                    <Button size="sm" onClick={() => submitReply(p.id)} className="min-h-8 rounded-lg px-3 text-xs">Reply</Button>
                  </div>
                </motion.div>
              )}</AnimatePresence>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
