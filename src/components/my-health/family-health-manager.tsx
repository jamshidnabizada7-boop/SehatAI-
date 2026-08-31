'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  User,
  Heart,
  Baby,
  Plus,
  Trash2,
  Edit3,
  ChevronRight,
  AlertCircle,
  X,
  Pill,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store/app-store';
import { resolveUiLang } from '@/lib/i18n';
import type { Lang } from '@/lib/types';
import {
  type FamilyMember,
  type Relation,
  loadFamily,
  saveFamily,
  sanitizeMember,
  RELATION_META,
} from '@/lib/family-health';
import { cn } from '@/lib/utils';

// ============================================================
// SehatAI — Family Health Management (Phase 2)
// Multi-profile system: track health for self, spouse, children,
// parents, siblings. Each member has: name, relation, age band,
// sex, conditions, allergies, medications, notes.
//
// Privacy: localStorage (sehatai.family.v1). No server calls.
// ============================================================

const RELATIONS: Relation[] = ['self', 'spouse', 'child', 'parent', 'sibling', 'other'];
const AGE_BANDS = ['undisclosed', 'child', 'adolescent', 'young-adult', 'middle-adult', 'elderly'] as const;
const SEXES = ['undisclosed', 'female', 'male'] as const;

const RELATION_ICONS: Record<Relation, typeof User> = {
  self: User,
  spouse: Heart,
  child: Baby,
  parent: Users,
  sibling: Users,
  other: User,
};

const AGE_LABELS: Record<string, { en: string; ur: string; roman: string }> = {
  undisclosed: { en: 'Prefer not to say', ur: 'بتانے سے معذرت', roman: 'Naheen batana' },
  child: { en: 'Child (under 12)', ur: 'بچہ', roman: 'Baccha' },
  adolescent: { en: 'Adolescent (12-17)', ur: 'نوجوان', roman: 'Nojawan' },
  'young-adult': { en: 'Young adult (18-34)', ur: 'نوجوان بالغ', roman: 'Nojawan adult' },
  'middle-adult': { en: 'Adult (35-59)', ur: 'بالغ', roman: 'Adult' },
  elderly: { en: 'Elderly (60+)', ur: 'بزرگ', roman: 'Buzurg' },
};

const SEX_LABELS: Record<string, { en: string; ur: string; roman: string }> = {
  undisclosed: { en: 'Prefer not to say', ur: 'بتانے سے معذرت', roman: 'Naheen batana' },
  female: { en: 'Female', ur: 'خواتین', roman: 'Aurat' },
  male: { en: 'Male', ur: 'مرد', roman: 'Mard' },
};

interface FamilyHealthManagerProps {
  lang: Lang;
  className?: string;
}

export function FamilyHealthManager({ lang, className }: FamilyHealthManagerProps) {
  const [members, setMembers] = useState<FamilyMember[]>(() => loadFamily());
  const [editing, setEditing] = useState<FamilyMember | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const save = useCallback((updated: FamilyMember[]) => {
    setMembers(updated);
    saveFamily(updated);
  }, []);

  const handleSave = (member: FamilyMember) => {
    const existing = members.find((m) => m.id === member.id);
    if (existing) {
      save(members.map((m) => (m.id === member.id ? member : m)));
    } else {
      save([...members, member]);
    }
    setEditing(null);
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    save(members.filter((m) => m.id !== id));
  };

  const startAdd = () => {
    setEditing(sanitizeMember({ relation: 'self' }));
    setIsAdding(true);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('rounded-2xl border border-indigo-500/30 bg-indigo-50/30 p-4 shadow-sm dark:bg-indigo-950/10', className)}
      aria-label={lang === 'ur' ? 'خاندان کی صحت' : lang === 'roman' ? 'Khandan ki sehat' : 'Family health management'}
    >
      {/* header */}
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
          <Users className="h-5 w-5" aria-hidden />
        </span>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-foreground">
            {lang === 'ur' ? 'خاندان کی صحت' : lang === 'roman' ? 'Khandan ki sehat' : 'Family health'}
          </h3>
          <p className="text-[11px] text-muted-foreground">
            {members.length} {lang === 'ur' ? 'ارکان' : lang === 'roman' ? 'arkaan' : 'members'}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={startAdd} className="h-7 gap-1 px-2 text-[11px] font-semibold text-primary">
          <Plus className="h-3 w-3" aria-hidden />
          {lang === 'ur' ? 'شامل کریں' : lang === 'roman' ? 'Shamil karein' : 'Add'}
        </Button>
      </div>

      {/* members list */}
      {members.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-foreground">
          {lang === 'ur'
            ? 'اپنے خاندان کے افراد کی صحت کی معلومات شامل کریں — والدین، بچوں، یا شوہر/بیوی کے لیے۔'
            : lang === 'roman'
              ? 'Apne khandan ke afraad ki sehat ki maloomat shamil karein — walidain, bachon, ya shohar/biwi ke liye.'
              : 'Add health profiles for your family — parents, children, or spouse. All data stays on this device.'}
        </p>
      ) : (
        <ul className="space-y-2">
          {members.map((m, i) => {
            const Icon = RELATION_ICONS[m.relation];
            const meta = RELATION_META[m.relation];
            return (
              <motion.li
                key={m.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <button
                  type="button"
                  onClick={() => { setEditing(m); setIsAdding(false); }}
                  className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 text-start shadow-sm transition-all hover:border-primary/30 hover:shadow-md focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', meta.color)}>
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-1.5">
                      <span className="truncate text-sm font-bold text-foreground">{m.name || 'Unnamed'}</span>
                      <Badge variant="secondary" className={cn('text-[9px] font-bold', meta.color)}>{meta.label[lang]}</Badge>
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                      {m.ageBand !== 'undisclosed' ? <span>{AGE_LABELS[m.ageBand]?.[lang]}</span> : null}
                      {m.sex !== 'undisclosed' ? <span>· {SEX_LABELS[m.sex]?.[lang]}</span> : null}
                      {m.conditions.length > 0 ? <span>· 💊 {m.conditions.length}</span> : null}
                      {m.allergies.length > 0 ? <span>· ⚠ {m.allergies.length}</span> : null}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40" aria-hidden />
                </button>
              </motion.li>
            );
          })}
        </ul>
      )}

      {/* privacy note */}
      <p className="mt-2 text-center text-[10px] text-muted-foreground">
        {lang === 'ur' ? 'خاندان کا ڈیٹا صرف اس ڈیوائس پر محفوظ ہے۔' : lang === 'roman' ? 'Khandan ka data sirf is device par mehfooz hai.' : 'Family data stored only on this device.'}
      </p>

      {/* editor modal */}
      <AnimatePresence>
        {editing ? (
          <FamilyMemberEditor
            member={editing}
            lang={lang}
            onSave={handleSave}
            onCancel={() => { setEditing(null); setIsAdding(false); }}
            onDelete={isAdding ? undefined : () => { handleDelete(editing.id); setEditing(null); }}
          />
        ) : null}
      </AnimatePresence>
    </motion.section>
  );
}

// ---------- Member editor ----------

function FamilyMemberEditor({
  member,
  lang,
  onSave,
  onCancel,
  onDelete,
}: {
  member: FamilyMember;
  lang: Lang;
  onSave: (m: FamilyMember) => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const [draft, setDraft] = useState<FamilyMember>(member);
  const [allergiesText, setAllergiesText] = useState(member.allergies.join('\n'));
  const [medsText, setMedsText] = useState(member.medications.join('\n'));
  const [conditionsText, setConditionsText] = useState(member.conditions.join('\n'));

  const handleSave = () => {
    const updated: FamilyMember = {
      ...draft,
      conditions: conditionsText.split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 10),
      allergies: allergiesText.split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 10),
      medications: medsText.split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 10),
      updatedAt: new Date().toISOString(),
    };
    onSave(updated);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="custom-scrollbar max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-border bg-background p-4 shadow-xl sm:rounded-2xl"
      >
        {/* header */}
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-bold text-foreground">
            {lang === 'ur' ? 'رکن کی معلومات' : lang === 'roman' ? 'Rukn ki maloomat' : 'Member details'}
          </h4>
          <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8">
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </div>

        <div className="space-y-3">
          {/* name */}
          <div>
            <Label className="mb-1 block text-[11px] font-bold text-muted-foreground">
              {lang === 'ur' ? 'نام' : lang === 'roman' ? 'Naam' : 'Name'}
            </Label>
            <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Ayesha" className="h-10" />
          </div>

          {/* relation */}
          <div>
            <Label className="mb-1 block text-[11px] font-bold text-muted-foreground">
              {lang === 'ur' ? 'رشتہ' : lang === 'roman' ? 'Rishta' : 'Relation'}
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {RELATIONS.map((r) => {
                const meta = RELATION_META[r];
                const Icon = RELATION_ICONS[r];
                const isActive = draft.relation === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setDraft({ ...draft, relation: r })}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors',
                      isActive ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-accent/30',
                    )}
                  >
                    <Icon className="h-3 w-3" aria-hidden />
                    {meta.label[lang]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* age band + sex */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="mb-1 block text-[11px] font-bold text-muted-foreground">
                {lang === 'ur' ? 'عمر' : lang === 'roman' ? 'Umar' : 'Age band'}
              </Label>
              <div className="flex flex-wrap gap-1">
                {AGE_BANDS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setDraft({ ...draft, ageBand: a })}
                    className={cn(
                      'rounded-md border px-2 py-1 text-[10px] font-semibold transition-colors',
                      draft.ageBand === a ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border text-muted-foreground',
                    )}
                  >
                    {AGE_LABELS[a]?.[lang]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-1 block text-[11px] font-bold text-muted-foreground">
                {lang === 'ur' ? 'جنس' : lang === 'roman' ? 'Jins' : 'Sex'}
              </Label>
              <div className="flex gap-1">
                {SEXES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setDraft({ ...draft, sex: s })}
                    className={cn(
                      'rounded-md border px-2 py-1 text-[10px] font-semibold transition-colors',
                      draft.sex === s ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border text-muted-foreground',
                    )}
                  >
                    {SEX_LABELS[s]?.[lang]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* conditions */}
          <div>
            <Label className="mb-1 block text-[11px] font-bold text-muted-foreground">
              {lang === 'ur' ? 'بیماریاں (فی سطر ایک)' : lang === 'roman' ? 'Bimariyan (fi satar ek)' : 'Conditions (one per line)'}
            </Label>
            <textarea
              value={conditionsText}
              onChange={(e) => setConditionsText(e.target.value)}
              placeholder="Diabetes&#10;Hypertension"
              rows={2}
              className="w-full rounded-lg border border-border bg-card p-2 text-sm"
              dir="ltr"
            />
          </div>

          {/* allergies */}
          <div>
            <Label className="mb-1 block text-[11px] font-bold text-muted-foreground">
              {lang === 'ur' ? 'الرجیز (فی سطر ایک)' : lang === 'roman' ? 'Allergies (fi satar ek)' : 'Allergies (one per line)'}
            </Label>
            <textarea
              value={allergiesText}
              onChange={(e) => setAllergiesText(e.target.value)}
              placeholder="Penicillin&#10;Sulfa"
              rows={2}
              className="w-full rounded-lg border border-border bg-card p-2 text-sm"
              dir="ltr"
            />
          </div>

          {/* medications */}
          <div>
            <Label className="mb-1 block text-[11px] font-bold text-muted-foreground">
              {lang === 'ur' ? 'ادویات (فی سطر ایک)' : lang === 'roman' ? 'Adwayaat (fi satar ek)' : 'Medications (one per line)'}
            </Label>
            <textarea
              value={medsText}
              onChange={(e) => setMedsText(e.target.value)}
              placeholder="Metformin 500mg&#10;Amlodipine 5mg"
              rows={2}
              className="w-full rounded-lg border border-border bg-card p-2 text-sm"
              dir="ltr"
            />
          </div>

          {/* notes */}
          <div>
            <Label className="mb-1 block text-[11px] font-bold text-muted-foreground">
              {lang === 'ur' ? 'نوٹس' : lang === 'roman' ? 'Notes' : 'Notes'}
            </Label>
            <Input value={draft.notes ?? ''} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} placeholder="Blood group: O+" className="h-10" />
          </div>
        </div>

        {/* actions */}
        <div className="mt-4 flex gap-2">
          {onDelete ? (
            <Button variant="outline" size="sm" onClick={onDelete} className="gap-1.5 border-red-500/30 text-red-700 hover:bg-red-500/10 dark:text-red-400">
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              {lang === 'ur' ? 'حذف کریں' : lang === 'roman' ? 'Hatif karein' : 'Delete'}
            </Button>
          ) : null}
          <Button variant="outline" size="sm" onClick={onCancel} className="flex-1 gap-1.5">
            <X className="h-3.5 w-3.5" aria-hidden />
            {lang === 'ur' ? 'منسوخ' : lang === 'roman' ? 'Mansookh' : 'Cancel'}
          </Button>
          <Button size="sm" onClick={handleSave} className="flex-1 gap-1.5">
            {lang === 'ur' ? 'محفوظ کریں' : lang === 'roman' ? 'Mehfooz karein' : 'Save'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
