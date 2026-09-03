'use client';

import { useRef, useState } from 'react';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { t } from '@/lib/i18n';
import type { Lang } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ImageInputProps {
  lang: Lang;
  disabled?: boolean;
  onImage: (base64: string, preview: string) => void;
}

/** Image upload button for VLM analysis (rash, skin conditions, wound photos).
 *  Converts selected image to base64 and passes it to the parent for preview + analysis. */
export function ImageInput({ lang, disabled, onImage }: ImageInputProps) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        description: lang === 'ur'
          ? 'صرف تصویر اپ لوڈ کریں'
          : lang === 'roman'
            ? 'Sirf tasveer upload karein'
            : 'Please upload an image file only',
        variant: 'destructive',
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({
        description: lang === 'ur'
          ? 'تصویر 5MB سے کم ہونی چاہیے'
          : lang === 'roman'
            ? 'Tasveer 5MB se kam honi chahiye'
            : 'Image must be under 5MB',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] ?? '';
      onImage(base64, result);
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    };
    reader.onerror = () => {
      setLoading(false);
      toast({
        description: lang === 'ur'
          ? 'تصویر لوڈ نہیں ہوئی'
          : lang === 'roman'
            ? 'Tasveer load nahin hui'
            : 'Could not load image',
        variant: 'destructive',
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
        aria-label={t(lang, 'chat.recordVoice') === 'Record voice' ? 'Upload image' : 'تصویر اپ لوڈ کریں'}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || loading}
        className={cn(
          'h-11 w-11 shrink-0 rounded-xl',
          'hover:border-primary/50 hover:text-primary',
        )}
        aria-label={lang === 'ur' ? 'تصویر اپ لوڈ کریں' : lang === 'roman' ? 'Tasveer upload karein' : 'Upload image'}
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        ) : (
          <ImagePlus className="h-5 w-5" aria-hidden />
        )}
      </Button>
    </>
  );
}
