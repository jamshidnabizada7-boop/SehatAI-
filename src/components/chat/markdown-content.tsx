'use client';

import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import type { Citation } from '@/lib/types';

interface MarkdownContentProps {
  content: string;
  className?: string;
  /** message citations — inline [id] markers are turned into superscript numbers */
  citations?: Citation[];
}

const SUPERSCRIPTS = ['¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹', '¹⁰'];

/**
 * Convert inline [corpus-id] citation markers into superscript footnote
 * numbers matching the numbered CitationCards below the message, and clean
 * up malformed marker artifacts (e.g. a stray "eadache]" left by the LLM).
 */
export function formatCitationMarkers(content: string, citations?: Citation[]): string {
  if (!citations || citations.length === 0) return content;
  let out = content;
  citations.forEach((c, i) => {
    const sup = SUPERSCRIPTS[i] ?? `(${i + 1})`;
    // replace every [id] occurrence (id case-insensitive)
    const escaped = c.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out.replace(new RegExp(`\\s*\\[${escaped}\\]`, 'gi'), (m) => (m.startsWith(' ') ? ' ' : '') + sup);
  });
  // strip leftover well-formed latin bracket markers (unknown ids)
  out = out.replace(/\s*\[[a-z0-9][a-z0-9 -]{1,30}\]/gi, '');
  // strip orphan artifacts: a latin word followed by "]" with no opener (e.g. "eadache]")
  out = out.replace(/(^|[\s•\-*])[a-z][a-z0-9-]{2,}\](?=[\s.,;:!?)\n]|$)/g, '$1');
  return out;
}

/**
 * Simple markdown renderer for chat content: bold, bullets, line breaks.
 * Headings are intentionally rendered as bold text (no heading semantics).
 * Bold-then-colon patterns (e.g. `**GO NOW IF:**`) render as tinted labels
 * so key takeaways pop without distracting from body bold.
 */
export function MarkdownContent({ content, className, citations }: MarkdownContentProps) {
  const formatted = formatCitationMarkers(content, citations);
  return (
    <div
      className={cn('text-sm leading-relaxed text-foreground/95 [&_*:first-child]:mt-0 [&_*:last-child]:mb-0', className)}
    >
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-2.5 whitespace-pre-wrap last:mb-0">{children}</p>,
          strong: ({ children }) => (
            <strong className="font-bold text-foreground">{children}</strong>
          ),
          em: ({ children }) => <em className="text-muted-foreground italic">{children}</em>,
          ul: ({ children }) => (
            <ul className="mb-2.5 space-y-1.5 ps-5 last:mb-0 [&_li]:relative [&_li]:ps-2.5 [&_li::before]:absolute [&_li::before]:-left-2 [&_li::before]:top-[0.55em] [&_li::before]:h-1.5 [&_li::before]:w-1.5 [&_li::before]:rounded-full [&_li::before]:bg-primary/70 [&_li::before]:content-['']">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-2.5 list-decimal space-y-1.5 ps-5 last:mb-0 marker:text-primary marker:font-bold">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              {children}
            </a>
          ),
          h1: ({ children }) => <p className="mb-2 text-base font-bold last:mb-0">{children}</p>,
          h2: ({ children }) => <p className="mb-2 text-base font-bold last:mb-0">{children}</p>,
          h3: ({ children }) => <p className="mb-2 font-bold last:mb-0">{children}</p>,
          h4: ({ children }) => <p className="mb-2 font-bold last:mb-0">{children}</p>,
          h5: ({ children }) => <p className="mb-2 font-bold last:mb-0">{children}</p>,
          h6: ({ children }) => <p className="mb-2 font-bold last:mb-0">{children}</p>,
          blockquote: ({ children }) => (
            <blockquote className="mb-2.5 border-s-2 border-primary/50 bg-primary/5 ps-3 py-1 text-foreground/90 last:mb-0">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-3 border-border" />,
          code: ({ children }) => (
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">{children}</code>
          ),
        }}
      >
        {formatted}
      </ReactMarkdown>
    </div>
  );
}
