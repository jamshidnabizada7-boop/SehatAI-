'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HeartPulse, Loader2, Plus, X, CheckCircle2, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Program { id: string; programType: string; programName: string; currentWeek: number; totalWeeks: number; status: string; completedTasks: string[]; currentWeekData: { week: number; title: string; tasks: string[] } | null; startDate: string; }
interface AvailProgram { type: string; name: string; totalWeeks: number; }

export function ChronicPrograms() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [available, setAvailable] = useState<AvailProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await fetch('/api/chronic-programs', { cache: 'no-store' }); if (r.ok) { const d = await r.json(); setPrograms(d.programs); setAvailable(d.availablePrograms); } } catch {}
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const enroll = async (type: string) => {
    setEnrolling(true);
    try { const r = await fetch('/api/chronic-programs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ programType: type }) });
      if (!r.ok) { const d = await r.json().catch(() => ({})); return toast.error(d.error ?? 'Failed to enroll.'); }
      toast.success('Enrolled! Start with Week 1.'); load();
    } finally { setEnrolling(false); }
  };

  const completeTask = async (id: string, taskId: string) => {
    try { const r = await fetch('/api/chronic-programs', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, taskId }) });
      if (r.ok) { toast.success('Task completed!'); load(); }
    } catch {}
  };

  const activePrograms = programs.filter(p => p.status === 'active');

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <h3 className="flex items-center gap-1.5 text-sm font-bold text-foreground"><HeartPulse className="h-4 w-4 text-rose-500" /> Chronic Disease Programs</h3>
        {loading ? <div className="mt-2 h-20 animate-pulse rounded-xl bg-muted/30" /> : (
          <>
            {activePrograms.length > 0 && (
              <div className="mt-3 space-y-2">
                {activePrograms.map(p => (
                  <div key={p.id} className="rounded-xl border border-border bg-background p-3">
                    <div className="flex items-center justify-between">
                      <div><p className="text-sm font-bold text-foreground">{p.programName}</p><p className="text-[10px] text-muted-foreground">Week {p.currentWeek} of {p.totalWeeks}</p></div>
                      <Badge className="bg-emerald-500/15 text-[9px] text-emerald-700">Active</Badge>
                    </div>
                    {p.currentWeekData && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-foreground">{p.currentWeekData.title}</p>
                        <ul className="mt-1 space-y-1">
                          {p.currentWeekData.tasks.map(task => {
                            const taskId = `${p.currentWeek}-${task}`;
                            const done = p.completedTasks.includes(taskId);
                            return (
                              <li key={task}>
                                <button onClick={() => !done && completeTask(p.id, taskId)} className={cn('flex w-full items-center gap-2 rounded-lg p-1.5 text-xs transition-colors', done ? 'bg-emerald-500/10 text-muted-foreground line-through' : 'hover:bg-accent text-foreground')}>
                                  <span className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded border', done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-border')}>{done && <CheckCircle2 className="h-3 w-3" />}</span>
                                  {task}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(p.completedTasks.length / (p.currentWeekData?.tasks.length || 1)) * 100}%` }} /></div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-2">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Available Programs</p>
              <div className="flex flex-wrap gap-1.5">
                {available.map(prog => (
                  <Button key={prog.type} size="sm" variant="outline" onClick={() => enroll(prog.type)} disabled={enrolling || programs.some(p => p.programType === prog.type && p.status === 'active')} className="min-h-9 gap-1 rounded-xl text-xs">
                    <Plus className="h-3 w-3" /> {prog.name} ({prog.totalWeeks}w)
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
