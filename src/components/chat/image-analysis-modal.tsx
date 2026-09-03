'use client';

import { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ImagePlus,
  X,
  Loader2,
  Send,
  Camera,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { t } from '@/lib/i18n';
import type { Lang } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ImageAnalysisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lang: Lang;
}

interface AnalysisResult {
  analysis: string;
  disclaimer: string;
  timestamp: string;
}

const SUGGESTION_CHIPS: { en: string; ur: string; roman: string }[] = [
  {
    en: 'Analyze this skin condition / wound / rash',
    ur: 'اس جلد کی حالت / زخم / خارش کا تجزیہ کریں',
    roman: 'Is jild ki halat / zakhm / kharish ka tajziya karein',
  },
  {
    en: 'Is this mole concerning? What signs should I watch for?',
    ur: 'کیا یہ تلو نقصان دہ ہے؟ میں کون سی علامات دیکھوں؟',
    roman: 'Kya yeh til nuqsan deh hai? Main kaun si alamaat dekhoon?',
  },
  {
    en: 'What could this swelling / lump be?',
    ur: 'یہ سوجن / گلٹی کیا ہو سکتی ہے؟',
    roman: 'Yeh soojan / gilty kya ho sakti hai?',
  },
  {
    en: 'Does this look infected? What should I do?',
    ur: 'کیا یہ متاثر معلوم ہوتا ہے؟ میں کیا کروں؟',
    roman: 'Kya yeh mutaasir maloom hota hai? Main kya karoon?',
  },
  {
    en: 'Is this a burn? What degree and what first aid?',
    ur: 'کیا یہ جلن ہے؟ کون سی ڈگری اور کیا ابتدائی امداد؟',
    roman: 'Kya yeh jalan hai? Kaun si degree aur kya ibtidai imdaad?',
  },
];

/** Full-screen modal for AI image analysis (rash, wound, skin conditions).
 *  Uploads an image, sends to /api/vlm-analyze, displays advisory analysis. */
export function ImageAnalysisModal({ open, onOpenChange, lang }: ImageAnalysisModalProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setImagePreview(null);
    setImageBase64(null);
    setQuestion('');
    setAnalyzing(false);
    setResult(null);
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onOpenChange(false);
  }, [reset, onOpenChange]);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) {
        toast({
          description: lang === 'ur' ? 'صرف تصویر اپ لوڈ کریں' : lang === 'roman' ? 'Sirf tasveer upload karein' : 'Please upload an image file only',
          variant: 'destructive',
        });
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        toast({
          description: lang === 'ur' ? 'تصویر 8MB سے کم ہونی چاہیے' : lang === 'roman' ? 'Tasveer 8MB se kam honi chahiye' : 'Image must be under 8MB',
          variant: 'destructive',
        });
        return;
      }

      setError(null);
      setResult(null);
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setImageBase64(result.split(',')[1] ?? '');
      };
      reader.onerror = () => {
        toast({
          description: lang === 'ur' ? 'تصویر لوڈ نہیں ہوئی' : lang === 'roman' ? 'Tasveer load nahin hui' : 'Could not load image',
          variant: 'destructive',
        });
      };
      reader.readAsDataURL(file);
    },
    [lang, toast],
  );

  const handleAnalyze = useCallback(async () => {
    if (!imageBase64) {
      toast({
        description: lang === 'ur' ? 'پہلے تصویر منتخب کریں' : lang === 'roman' ? 'Pehle tasveer muntakhib karein' : 'Please select an image first',
        variant: 'destructive',
      });
      return;
    }

    setAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/vlm-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageBase64,
          question: question || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Analysis failed' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = (await res.json()) as AnalysisResult;
      setResult(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      toast({
        description: lang === 'ur' ? 'تجزیہ ناکام ہوا' : lang === 'roman' ? 'Tajziya nakam howa' : 'Analysis failed',
        variant: 'destructive',
      });
    } finally {
      setAnalyzing(false);
    }
  }, [imageBase64, question, lang, toast]);

  const labels = {
    title: lang === 'ur' ? 'AI تصویری تجزیہ' : lang === 'roman' ? 'AI Tasveeri Tajziya' : 'AI Image Analysis',
    subtitle:
      lang === 'ur'
        ? 'تصویر اپ لوڈ کریں (خارش، زخم، جلد کی حالت) اور AI سے مشاورتی تجزیہ حاصل کریں۔'
        : lang === 'roman'
          ? 'Tasveer upload karein (kharish, zakhm, jild ki halat) aur AI se mashwarati tajziya hasool karein.'
          : 'Upload a photo (rash, wound, skin condition) and get an AI-generated advisory analysis.',
    imageLabel: lang === 'ur' ? 'تصویر' : lang === 'roman' ? 'Tasveer' : 'IMAGE',
    pickImage: lang === 'ur' ? 'تصویر منتخب کریں' : lang === 'roman' ? 'Tasveer muntakhib karein' : 'Tap to pick an image',
    imageHint: 'JPG, PNG, or WebP · max 8MB',
    questionLabel: lang === 'ur' ? 'AI کیا تلاش کرے؟' : lang === 'roman' ? 'AI kya talash kare?' : 'WHAT SHOULD THE AI LOOK FOR?',
    questionPlaceholder:
      lang === 'ur'
        ? 'اس جلد کی حالت / زخم / خارش کا تجزیہ کریں'
        : lang === 'roman'
          ? 'Is jild ki halat / zakhm / kharish ka tajziya karein'
          : 'Analyze this skin condition / wound / rash',
    analyze: lang === 'ur' ? 'تجزیہ کریں' : lang === 'roman' ? 'Tajziya karein' : 'Analyze image',
    analyzing: lang === 'ur' ? 'تجزیہ ہو رہا ہے…' : lang === 'roman' ? 'Tajziya ho raha hai…' : 'Analyzing…',
    close: lang === 'ur' ? 'بند کریں' : lang === 'roman' ? 'Band karein' : 'Close',
    changeImage: lang === 'ur' ? 'تصویر تبدیل کریں' : lang === 'roman' ? 'Tasveer tabdeel karein' : 'Change image',
    result: lang === 'ur' ? 'تجزیہ کا نتیجہ' : lang === 'roman' ? 'Tajziya ka nateeja' : 'Analysis Result',
    disclaimer:
      lang === 'ur'
        ? 'یہ AI تجزیہ صرف مشاورتی ہے۔ درست تشخیص کے لیے لائسنس یافتہ ڈاکٹر سے رجوع کریں۔'
        : lang === 'roman'
          ? 'Yeh AI tajziya sirf mashwarati hai. Durust tashkhees ke liye licensed doctor se rujoo karein.'
          : 'This AI analysis is advisory only. Clinical correlation and diagnosis by a licensed physician required.',
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2 }}
            className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-background shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={labels.title}
          >
            {/* Header */}
            <div className="flex items-start gap-3 border-b border-border p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-400">
                <Sparkles className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-bold text-foreground">{labels.title}</h2>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{labels.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label={labels.close}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="custom-scrollbar flex-1 overflow-y-auto p-5">
              {/* Image upload zone */}
              <p className="mb-2 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                {labels.imageLabel}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />

              {imagePreview ? (
                <div className="relative overflow-hidden rounded-xl border-2 border-violet-500/30 bg-violet-500/5">
                  <img
                    src={imagePreview}
                    alt="Uploaded preview"
                    className="max-h-64 w-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute right-2 top-2 rounded-lg bg-background/90 px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-sm backdrop-blur transition-colors hover:bg-background"
                  >
                    {labels.changeImage}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-emerald-500/40 bg-emerald-50/50 p-8 transition-colors hover:border-emerald-500/60 hover:bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-950/10 dark:hover:bg-emerald-950/20"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-sm">
                    <ImagePlus className="h-6 w-6 text-emerald-600 dark:text-emerald-400" aria-hidden />
                  </span>
                  <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{labels.pickImage}</span>
                  <span className="text-[11px] text-muted-foreground">{labels.imageHint}</span>
                </button>
              )}

              {/* Question input */}
              <p className="mb-2 mt-5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                {labels.questionLabel}
              </p>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={labels.questionPlaceholder}
                rows={2}
                dir="auto"
                className="custom-scrollbar w-full resize-none rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
              />

              {/* Suggestion chips */}
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {SUGGESTION_CHIPS.map((chip, i) => {
                  const text = chip[lang] || chip.en;
                  const isActive = question === text;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setQuestion(text)}
                      className={cn(
                        'rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
                        isActive
                          ? 'border-violet-500 bg-violet-500 text-white'
                          : 'border-border bg-card text-foreground/80 hover:border-violet-500/40 hover:bg-violet-50 dark:hover:bg-violet-950/20',
                      )}
                    >
                      {text.length > 40 ? `${text.slice(0, 40)}…` : text}
                    </button>
                  );
                })}
              </div>

              {/* Error */}
              {error ? (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-50/60 p-3 dark:bg-red-950/20">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" aria-hidden />
                  <p className="text-xs text-red-700 dark:text-red-400">{error}</p>
                </div>
              ) : null}

              {/* Result */}
              {result ? (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden />
                    {labels.result}
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{result.analysis}</p>
                  </div>
                  <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-50/60 p-3 dark:bg-amber-950/20">
                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
                    <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">{labels.disclaimer}</p>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 border-t border-border p-4">
              <button
                type="button"
                onClick={handleClose}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                ✕ {labels.close}
              </button>
              <Button
                type="button"
                onClick={handleAnalyze}
                disabled={!imageBase64 || analyzing}
                className="gap-1.5 rounded-xl bg-violet-600 px-4 font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    {labels.analyzing}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" aria-hidden />
                    {labels.analyze}
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
