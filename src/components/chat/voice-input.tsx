'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, Send, Square, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { t } from '@/lib/i18n';
import type { Lang } from '@/lib/types';
import { cn } from '@/lib/utils';

interface VoiceInputProps {
  lang: Lang;
  disabled?: boolean;
  offline: boolean;
  onSend: (text: string) => void;
}

function blobToBase64(blob: Blob): Promise<string> {
  return blob.arrayBuffer().then((buffer) => {
    const bytes = new Uint8Array(buffer);
    const chunks: string[] = [];
    for (let i = 0; i < bytes.length; i += 0x8000) {
      chunks.push(String.fromCharCode(...bytes.subarray(i, i + 0x8000)));
    }
    return btoa(chunks.join(''));
  });
}

/** Mic button + recording UI + editable transcript confirm dialog. */
export function VoiceInput({ lang, disabled, offline, onSend }: VoiceInputProps) {
  const { toast } = useToast();
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRef.current?.state === 'recording') mediaRef.current.stop();
    };
  }, []);

  const startRecording = useCallback(async () => {
    if (offline) {
      toast({ description: t(lang, 'voice.offlineError'), variant: 'destructive' });
      return;
    }
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      toast({ description: t(lang, 'voice.micError'), variant: 'destructive' });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : undefined;
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        if (blob.size === 0) {
          toast({ description: t(lang, 'voice.micError'), variant: 'destructive' });
          return;
        }
        setTranscribing(true);
        try {
          const audioBase64 = await blobToBase64(blob);
          const res = await fetch('/api/voice/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioBase64,
              mimeType: blob.type || 'audio/webm',
            }),
          });
          if (!res.ok) throw new Error(`transcribe ${res.status}`);
          const data = (await res.json()) as { text?: string };
          const text = (data.text ?? '').trim();
          if (!text) throw new Error('empty transcript');
          setTranscript(text);
        } catch {
          toast({ description: t(lang, 'voice.micError'), variant: 'destructive' });
        } finally {
          setTranscribing(false);
        }
      };
      recorder.start();
      mediaRef.current = recorder;
      setRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((v) => v + 1), 1000);
    } catch (err) {
      const name = (err as Error)?.name;
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        toast({ description: t(lang, 'voice.micDenied'), variant: 'destructive' });
      } else {
        toast({ description: t(lang, 'voice.micError'), variant: 'destructive' });
      }
    }
  }, [lang, offline, toast]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setRecording(false);
    if (mediaRef.current?.state === 'recording') mediaRef.current.stop();
  }, []);

  const cancelRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setRecording(false);
    chunksRef.current = [];
    if (mediaRef.current?.state === 'recording') {
      mediaRef.current.onstop = null;
      mediaRef.current.stop();
      // stop all tracks from the active stream
      if (mediaRef.current.stream) {
        mediaRef.current.stream.getTracks().forEach((tr) => tr.stop());
      }
    }
  }, []);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  return (
    <>
      {/* recording / transcribing bar — floats above the input row */}
      {recording || transcribing ? (
        <div
          className="absolute inset-x-0 bottom-full z-10 mb-2 flex h-12 items-center gap-3 rounded-2xl border border-red-300 bg-red-50 px-4 shadow-sm dark:border-red-900 dark:bg-red-950/70"
          role="status"
          aria-live="polite"
        >
          <span className="relative flex h-3 w-3">
            <span className="rec-pulse absolute inline-flex h-full w-full rounded-full bg-red-500" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-600" />
          </span>
          <span className="text-sm font-semibold text-red-700 dark:text-red-300">
            {transcribing
              ? t(lang, 'voice.transcribing')
              : `${t(lang, 'voice.recording')} ${mm}:${ss}`}
          </span>
          {!transcribing ? (
            <span className="ms-auto flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={cancelRecording}
                className="h-9 w-9 rounded-xl text-red-700 hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-900/50"
                aria-label={t(lang, 'chat.cancel')}
              >
                <X className="h-4 w-4" aria-hidden />
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={stopRecording}
                className="h-9 gap-1.5 rounded-xl bg-red-600 px-3 font-bold text-white hover:bg-red-700"
                aria-label={t(lang, 'voice.stop')}
              >
                <Square className="h-3.5 w-3.5 fill-current" aria-hidden />
                {t(lang, 'voice.stop')}
              </Button>
            </span>
          ) : null}
        </div>
      ) : null}

      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => void startRecording()}
        disabled={disabled}
        className={cn(
          'h-11 w-11 shrink-0 rounded-xl',
          'hover:border-primary/50 hover:text-primary',
          recording && 'border-red-400 text-red-600',
        )}
        aria-label={t(lang, 'chat.recordVoice')}
      >
        <Mic className="h-5 w-5" aria-hidden />
      </Button>

      <Dialog open={transcript !== null} onOpenChange={(open) => !open && setTranscript(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t(lang, 'voice.confirmTitle')}</DialogTitle>
            <DialogDescription>{t(lang, 'voice.confirmDesc')}</DialogDescription>
          </DialogHeader>
          <Textarea
            value={transcript ?? ''}
            onChange={(e) => setTranscript(e.target.value)}
            rows={4}
            className="custom-scrollbar resize-none"
            dir="auto"
            aria-label={t(lang, 'voice.confirmTitle')}
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setTranscript(null)}>
              {t(lang, 'chat.cancel')}
            </Button>
            <Button
              onClick={() => {
                const text = (transcript ?? '').trim();
                setTranscript(null);
                if (text) onSend(text);
              }}
              disabled={!(transcript ?? '').trim()}
              className="gap-1.5 bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Send className="h-4 w-4" aria-hidden />
              {t(lang, 'voice.send')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
