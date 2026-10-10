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

const FALLBACK_DOCS: Record<string, string> = {
  'telemedicine-consent': `> [!WARNING] DRAFT — COUNSEL REVIEW REQUIRED
> This document is an engineering draft prepared for architectural validation and requires comprehensive review by licensed legal counsel before production regulatory reliance.

# SehatAI Care Connect — Informed Consent for Telemedicine

> **DRAFT — REQUIRES COUNSEL REVIEW BEFORE ANY COMMERCIAL LAUNCH**  
> **Jurisdiction: PK (draft) / AF (draft)**  
> **Version:** 2026.10-draft · **Effective Date:** October 2026

---

## 1. Informed Consent Agreement

Before initiating any telemedicine consultation through SehatAI Care Connect ("Platform"), you must acknowledge and agree to this Informed Consent for Telemedicine. Telemedicine involves the delivery of healthcare services using digital telecommunications technologies, including electronic messaging, interactive audio, and real-time interactive video.

---

## 2. Nature and Limitations of Telemedicine

By agreeing to this document, you acknowledge and agree that:
1. **Absence of In-Person Physical Examination:** Telemedicine is fundamentally different from an in-person clinical encounter. The doctor cannot physically palpate, auscultate, or directly examine your physical body. Clinical evaluations are based exclusively on the information, symptoms, medical history, and visual/audio data you provide.
2. **Supplemental Care:** Telemedicine is intended to supplement, not completely replace, relationships with primary in-person physicians or tertiary medical institutions.
3. **Clinical Discretion:** The participating doctor retains full professional discretion to determine whether your specific medical complaint is appropriate for telemedicine. If the doctor determines that an in-person physical evaluation, laboratory investigation, or emergency intervention is warranted, they will instruct you to seek immediate in-person medical care.
4. **Prescription Constraints:** Telemedicine prescribing is governed strictly by the national laws of your declared jurisdiction. In Pakistan (PM&DC Telemedicine Guidelines) and Afghanistan, **prescriptions for controlled substances, narcotics, sedatives, and psychiatric medications requiring monitored in-person clinical observation are strictly prohibited** and blocked by the Platform.

---

## 3. Potential Risks and Technological Disruptions

1. **Connectivity Failures:** Digital communications are subject to network delays, equipment interruptions, or transmission errors. The Platform incorporates an automatic fallback protocol (VIDEO → AUDIO → TEXT) to preserve clinical communication, but technical failures may necessitate rescheduling.
2. **Data Transmission Security:** While Care Connect applies industry-standard encryption (TLS in transit, AES-256-GCM at rest), no internet transmission is 100% immune from security compromise.
3. **Information Incompleteness:** If you provide inaccurate, incomplete, or outdated medical histories, allergies, or medication lists, the accuracy of the medical guidance provided may be adversely impacted.

---

## 4. Patient Rights and Revocation

1. You have the right to withdraw your consent to telemedicine at any time without affecting your right to future care or standard medical treatment.
2. You have the right to inspect and receive copies of all medical records, consultation notes, and prescriptions generated during your consultation.
3. You have the right to ask questions regarding the diagnosis, prognosis, and treatment recommendations made by your attending doctor.

---

## 5. Explicit Patient Declaration

By consenting to telemedicine on SehatAI Care Connect, you declare that:
1. You are physically located in the jurisdiction declared during booking (Pakistan / Afghanistan).
2. You understand that SehatAI is a technology platform and not a medical provider.
3. You have read, understood, and voluntarily accept all risks, benefits, and limitations outlined in this consent agreement.`,
};

export async function generateStaticParams() {
  const legalDir = path.join(process.cwd(), 'docs', 'legal');
  const slugs = new Set<string>(['telemedicine-consent', 'telemedicine-consent.md']);
  if (fs.existsSync(legalDir)) {
    const files = fs.readdirSync(legalDir);
    for (const f of files) {
      if (f.endsWith('.md')) {
        slugs.add(f);
        slugs.add(f.replace(/\.md$/, ''));
      }
    }
  }
  return Array.from(slugs).map((slug) => ({ slug }));
}

export default async function LegalDocPage({ params }: PageProps) {
  const { slug } = await params;
  const cleanSlug = decodeURIComponent(slug).replace(/\.md$/, '');

  const possiblePaths = [
    path.join(process.cwd(), 'docs', 'legal', `${cleanSlug}.md`),
    path.join(process.cwd(), '..', 'docs', 'legal', `${cleanSlug}.md`),
    path.join(__dirname, '..', '..', '..', '..', 'docs', 'legal', `${cleanSlug}.md`),
    path.join(__dirname, '..', '..', '..', 'docs', 'legal', `${cleanSlug}.md`),
  ];

  let rawMarkdown: string | null = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        rawMarkdown = fs.readFileSync(p, 'utf8');
        break;
      } catch {}
    }
  }

  if (!rawMarkdown && FALLBACK_DOCS[cleanSlug]) {
    rawMarkdown = FALLBACK_DOCS[cleanSlug];
  }

  if (!rawMarkdown) {
    notFound();
  }

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
