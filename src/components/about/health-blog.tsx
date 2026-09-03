'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, Loader2, X, ArrowRight, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Post { id: string; slug: string; title: string; excerpt: string; content: string; category: string; tags: string[]; authorName: string; publishedAt: string; }

const CATEGORY_COLORS: Record<string, string> = {
  seasonal: 'bg-cyan-500/15 text-cyan-700', nutrition: 'bg-emerald-500/15 text-emerald-700',
  emergency: 'bg-red-500/15 text-red-700', maternal: 'bg-pink-500/15 text-pink-700',
  'child-health': 'bg-amber-500/15 text-amber-700', chronic: 'bg-violet-500/15 text-violet-700',
};

export function HealthBlog() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Post | null>(null);

  const load = useCallback(async () => {
    try { const r = await fetch('/api/blog?limit=6', { cache: 'no-store' }); if (r.ok) { const d = await r.json(); setPosts(d.posts); } } catch {}
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-3">
      <div><h3 className="flex items-center gap-1.5 text-sm font-bold text-foreground"><Newspaper className="h-4 w-4 text-primary" /> Health Blog</h3><p className="text-xs text-muted-foreground">Pakistan-specific health articles.</p></div>
      {loading ? <div className="space-y-2">{[0,1,2].map(i => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted/30" />)}</div> : (
        <div className="grid gap-2 sm:grid-cols-2">
          {posts.map((p, i) => (
            <motion.button key={p.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} onClick={() => setSelected(p)} className="group rounded-xl border border-border bg-card p-3 text-start shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
              <div className="flex items-center gap-2"><Badge className={cn('text-[9px]', CATEGORY_COLORS[p.category] ?? 'bg-muted text-muted-foreground')}>{p.category}</Badge><span className="text-[10px] text-muted-foreground">{new Date(p.publishedAt).toLocaleDateString()}</span></div>
              <p className="mt-1.5 text-sm font-bold leading-tight text-foreground group-hover:text-primary">{p.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">{p.excerpt}</p>
              <span className="mt-1.5 inline-flex items-center gap-0.5 text-[10px] font-semibold text-primary">Read more <ArrowRight className="h-3 w-3" /></span>
            </motion.button>
          ))}
        </div>
      )}
      <AnimatePresence>{selected && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} onClick={e => e.stopPropagation()} className="max-h-[85vh] w-full max-w-lg overflow-y-auto custom-scrollbar rounded-2xl bg-card p-5 shadow-2xl">
            <div className="mb-3 flex items-center justify-between"><Badge className={cn('text-[9px]', CATEGORY_COLORS[selected.category] ?? 'bg-muted')}>{selected.category}</Badge><button onClick={() => setSelected(null)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent"><X className="h-4 w-4" /></button></div>
            <h2 className="text-lg font-bold text-foreground">{selected.title}</h2>
            <p className="mt-1 text-xs text-muted-foreground">By {selected.authorName} · {new Date(selected.publishedAt).toLocaleDateString()}</p>
            <div className="prose prose-sm mt-3 max-w-none whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">{selected.content}</div>
            <div className="mt-4 flex flex-wrap gap-1.5">{selected.tags.map(t => <Badge key={t} variant="secondary" className="text-[9px]">{t}</Badge>)}</div>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>
    </div>
  );
}
