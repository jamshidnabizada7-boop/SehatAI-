import fs from 'node:fs';
import path from 'node:path';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-static';
export const revalidate = false;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const legalDir = path.join(process.cwd(), 'docs', 'legal');
  if (!fs.existsSync(legalDir)) return [];
  const files = fs.readdirSync(legalDir);
  const params: Array<{ slug: string }> = [];
  for (const f of files) {
    if (f.endsWith('.md')) {
      const base = f.replace(/\.md$/, '');
      params.push({ slug: f });
      params.push({ slug: base });
    }
  }
  return params;
}

export default async function LegalDocPage({ params }: PageProps) {
  const { slug } = await params;
  const cleanSlug = slug.replace(/\.md$/, '');
  const docPath = path.join(process.cwd(), 'docs', 'legal', `${cleanSlug}.md`);

  if (!fs.existsSync(docPath)) {
    notFound();
  }

  const rawMarkdown = fs.readFileSync(docPath, 'utf8');

  // Simple parsing of sections from markdown
  const lines = rawMarkdown.split('\n');
  const renderedSections: Array<{ type: 'h1' | 'h2' | 'p' | 'warn' | 'meta' | 'list'; text: string; items?: string[] }> = [];

  let currentList: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trimEnd() ?? '';
    if (!line) {
      if (currentList.length > 0) {
        renderedSections.push({ type: 'list', text: '', items: [...currentList] });
        currentList = [];
      }
      continue;
    }

    if (line.startsWith('> [!WARNING]')) {
      const warnLines = [line.replace('> [!WARNING]', '').trim()];
      while (i + 1 < lines.length && lines[i + 1]?.startsWith('>')) {
        i++;
        warnLines.push(lines[i]!.replace(/^>\s*/, '').trim());
      }
      renderedSections.push({ type: 'warn', text: warnLines.filter(Boolean).join(' ') });
    } else if (line.startsWith('>')) {
      const metaLines = [line.replace(/^>\s*/, '').trim()];
      while (i + 1 < lines.length && lines[i + 1]?.startsWith('>')) {
        i++;
        metaLines.push(lines[i]!.replace(/^>\s*/, '').trim());
      }
      renderedSections.push({ type: 'meta', text: metaLines.filter(Boolean).join('\n') });
    } else if (line.startsWith('# ')) {
      renderedSections.push({ type: 'h1', text: line.replace('# ', '').trim() });
    } else if (line.startsWith('## ')) {
      renderedSections.push({ type: 'h2', text: line.replace('## ', '').trim() });
    } else if (/^\d+\.\s+/.test(line)) {
      currentList.push(line.replace(/^\d+\.\s+/, '').trim());
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      currentList.push(line.replace(/^[-*]\s+/, '').trim());
    } else if (line === '---') {
      // divider
    } else {
      if (currentList.length > 0) {
        renderedSections.push({ type: 'list', text: '', items: [...currentList] });
        currentList = [];
      }
      renderedSections.push({ type: 'p', text: line });
    }
  }

  if (currentList.length > 0) {
    renderedSections.push({ type: 'list', text: '', items: [...currentList] });
  }

  return (
    <div className="min-h-screen bg-background text-foreground antialiased py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation & Document Header */}
        <div className="flex items-center justify-between border-b border-border/80 pb-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" /> Return to SehatAI
            </Button>
          </Link>
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <FileText className="h-4 w-4 text-primary" />
            <span>{cleanSlug}.md</span>
          </div>
        </div>

        {/* Regulatory Draft Disclaimer Banner */}
        <div role="alert" className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <p className="font-bold text-sm">
                DEMO / DRAFT — NOT VALIDATED BY REGULATORY COUNSEL
              </p>
              <p className="text-xs mt-1 text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                This document is an architectural engineering template designed for telemedicine compliance flows. It has NOT received formal approval from licensed medical-legal regulatory counsel in Pakistan (PM&amp;DC) or Afghanistan. Clinical consultations remain strictly disabled in staging.
              </p>
            </div>
          </div>
        </div>

        {/* Document Content */}
        <article className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-5">
          {renderedSections.map((sec, idx) => {
            if (sec.type === 'h1') {
              return (
                <h1 key={idx} className="text-2xl font-bold tracking-tight text-foreground border-b border-border pb-3">
                  {sec.text}
                </h1>
              );
            }
            if (sec.type === 'h2') {
              return (
                <h2 key={idx} className="text-lg font-bold text-foreground pt-3 border-t border-border/50">
                  {sec.text}
                </h2>
              );
            }
            if (sec.type === 'warn') {
              return (
                <div key={idx} className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive font-medium">
                  {sec.text}
                </div>
              );
            }
            if (sec.type === 'meta') {
              return (
                <div key={idx} className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
                  {sec.text.split('\n').map((m, mi) => (
                    <p key={mi}>{m.replace(/\*\*/g, '')}</p>
                  ))}
                </div>
              );
            }
            if (sec.type === 'list') {
              return (
                <ol key={idx} className="space-y-2.5 ps-5 list-decimal text-sm leading-relaxed text-foreground/90 marker:font-semibold marker:text-primary">
                  {sec.items?.map((item, itemIdx) => (
                    <li key={itemIdx} className="ps-1">
                      {item.replace(/\*\*(.*?)\*\*/g, '$1')}
                    </li>
                  ))}
                </ol>
              );
            }
            return (
              <p key={idx} className="text-sm leading-relaxed text-foreground/90">
                {sec.text.replace(/\*\*(.*?)\*\*/g, '$1')}
              </p>
            );
          })}
        </article>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border/60">
          <p>SehatAI Care Connect Architecture · Telemedicine Informed Consent · Version 2026.10-draft</p>
        </div>
      </div>
    </div>
  );
}
