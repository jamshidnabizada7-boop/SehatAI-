'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Plus, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { resolveUiLang as _r, t } from '@/lib/i18n';
import type { Lang } from '@/lib/types';
import {
  AGE_BAND_LABELS,
  CHRONIC_CONDITIONS,
  ageBandLabel,
  conditionLabel,
  emptyProfile,
  isValidPhone,
  newIceId,
  normalizeLineList,
  sanitizeProfile,
  sexLabel,
  SEX_LABELS,
  type AgeBand,
  type HealthProfile,
  type IceContact,
  type Sex,
} from '@/lib/profile';

interface ProfileCardProps {
  lang: Lang;
  profile: HealthProfile | null;
  onSave: (profile: HealthProfile) => void;
}

const AGE_BAND_ORDER: AgeBand[] = [
  'undisclosed',
  'child',
  'adolescent',
  'young-adult',
  'middle-adult',
  'elderly',
];

const SEX_ORDER: Sex[] = ['undisclosed', 'female', 'male'];

const COLLAPSE_GROUPS = ['demographics', 'conditions', 'allergies', 'meds', 'ice'] as const;
type CollapseGroup = (typeof COLLAPSE_GROUPS)[number];

/** Default: first time the user opens this view, all groups expanded so they
 *  can fill what they want. After they save once, default-collapse to a
 *  summary view and let them expand any group to edit. */
function initialOpenState(profileWasSet: boolean): Record<CollapseGroup, boolean> {
  return {
    demographics: true,
    conditions: true,
    allergies: !profileWasSet,
    meds: !profileWasSet,
    ice: !profileWasSet,
  };
}

export function ProfileCard({ lang, profile, onSave }: ProfileCardProps) {
  const [draft, setDraft] = useState<HealthProfile>(() => sanitizeProfile(profile));
  const [openState, setOpenState] = useState<Record<CollapseGroup, boolean>>(() => initialOpenState(!!profile && isAnyProfileFieldSet(profile)));
  const [saving, setSaving] = useState(false);
  const [iceErrors, setIceErrors] = useState<Record<string, string>>({});
  // Sync the external profile → local draft when the parent profile prop
  // changes (e.g. after a clear). Guarded by a ref so we don't loop.
  const lastSyncedAt = useRef<number | null>(null);

  useEffect(() => {
    if (!profile) {
      setDraft(emptyProfile());
      setOpenState(initialOpenState(false));
      return;
    }
    if (profile.updatedAt !== lastSyncedAt.current) {
      lastSyncedAt.current = profile.updatedAt;
      setDraft(sanitizeProfile(profile));
      setOpenState(initialOpenState(true));
    }
  }, [profile]);

  const toggle = (g: CollapseGroup) => setOpenState((s) => ({ ...s, [g]: !s[g] }));

  // ---------- Field setters ----------
  const setAge = (a: AgeBand) => setDraft((d) => ({ ...d, ageBand: a }));
  const setSex = (s: Sex) => setDraft((d) => ({ ...d, sex: s, pregnant: s === 'female' ? d.pregnant : false }));
  const togglePregnant = () => setDraft((d) => ({ ...d, pregnant: !d.pregnant }));
  const toggleCondition = (id: string) =>
    setDraft((d) => ({
      ...d,
      conditions: d.conditions.includes(id)
        ? d.conditions.filter((c) => c !== id)
        : [...d.conditions, id],
    }));
  const setAllergiesText = (text: string) => setDraft((d) => ({ ...d, allergies: normalizeLineList(text) }));
  const setMedsText = (text: string) => setDraft((d) => ({ ...d, medications: normalizeLineList(text) }));

  // ICE contacts
  const addIce = () =>
    setDraft((d) =>
      d.iceContacts.length >= 3
        ? d
        : { ...d, iceContacts: [...d.iceContacts, { id: newIceId(), name: '', phone: '', relation: '' }] },
    );
  const updateIce = (id: string, patch: Partial<IceContact>) =>
    setDraft((d) => ({
      ...d,
      iceContacts: d.iceContacts.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  const removeIce = (id: string) =>
    setDraft((d) => ({
      ...d,
      iceContacts: d.iceContacts.filter((c) => c.id !== id),
    }));

  // ---------- Save ----------
  const handleSave = useCallback(() => {
    const sanitized = sanitizeProfile(draft);
    // Validate ICE phone numbers (only when present)
    const errors: Record<string, string> = {};
    for (const c of sanitized.iceContacts) {
      if (c.phone && !isValidPhone(c.phone)) {
        errors[c.id] = t(lang, 'toast.iceInvalidPhone');
      }
    }
    setIceErrors(errors);
    if (Object.keys(errors).length > 0) {
      // Open the ICE group so the user can see the errors
      setOpenState((s) => ({ ...s, ice: true }));
      return;
    }
    setSaving(true);
    try {
      onSave(sanitized);
      // After first save, collapse to summary view
      setOpenState(initialOpenState(true));
    } finally {
      setSaving(false);
    }
  }, [draft, onSave, lang]);

  // Display values for textareas (arrays → newline-joined text)
  const allergiesText = draft.allergies.join('\n');
  const medsText = draft.medications.join('\n');

  return (
    <Card className="overflow-hidden border-border bg-card/60 shadow-sm">
      <CardHeader className="gap-1.5 border-b border-border bg-card/40 px-4 py-3 sm:px-6">
        <CardTitle className="text-base font-bold text-foreground">
          {t(lang, 'myHealth.profileSection')}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          {t(lang, 'myHealth.privacyNote')}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 px-4 py-4 sm:px-6">
        {/* Demographics */}
        <Collapsible open={openState.demographics} onOpenChange={() => toggle('demographics')}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-background/60 px-3 py-2.5 text-left text-sm font-bold text-foreground transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
              aria-expanded={openState.demographics}
            >
              <span>{t(lang, 'myHealth.demographicsTitle')}</span>
              <ChevronDown
                className={cn('h-4 w-4 text-muted-foreground transition-transform', openState.demographics && 'rotate-180')}
                aria-hidden
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="flex flex-col gap-4 pt-3">
            {/* Age band */}
            <fieldset className="flex flex-col gap-1.5">
              <legend className="text-xs font-semibold text-muted-foreground">
                {t(lang, 'myHealth.ageBand')}
              </legend>
              <div className="flex flex-wrap gap-1.5">
                {AGE_BAND_ORDER.map((band) => {
                  const active = draft.ageBand === band;
                  return (
                    <button
                      key={band}
                      type="button"
                      onClick={() => setAge(band)}
                      aria-pressed={active}
                      className={cn(
                        'inline-flex min-h-9 items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
                        active
                          ? 'border-primary bg-primary/12 text-primary'
                          : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
                      )}
                    >
                      {ageBandLabel(band, lang)}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* Sex */}
            <fieldset className="flex flex-col gap-1.5">
              <legend className="text-xs font-semibold text-muted-foreground">
                {t(lang, 'myHealth.sex')}
              </legend>
              <div className="flex flex-wrap gap-1.5">
                {SEX_ORDER.map((s) => {
                  const active = draft.sex === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSex(s)}
                      aria-pressed={active}
                      className={cn(
                        'inline-flex min-h-9 items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
                        active
                          ? 'border-primary bg-primary/12 text-primary'
                          : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
                      )}
                    >
                      {sexLabel(s, lang)}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* Pregnant toggle (only when sex === 'female') */}
            {draft.sex === 'female' ? (
              <div className="flex flex-col gap-1 rounded-xl border border-pink-500/25 bg-pink-500/5 px-3 py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="pregnant-toggle" className="text-sm font-semibold text-foreground">
                    {t(lang, 'myHealth.pregnant')}
                  </Label>
                  <Switch
                    id="pregnant-toggle"
                    checked={draft.pregnant}
                    onCheckedChange={togglePregnant}
                    aria-label={t(lang, 'myHealth.pregnant')}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {t(lang, 'myHealth.pregnantHint')}
                </p>
              </div>
            ) : null}
          </CollapsibleContent>
        </Collapsible>

        {/* Conditions */}
        <Collapsible open={openState.conditions} onOpenChange={() => toggle('conditions')}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-background/60 px-3 py-2.5 text-left text-sm font-bold text-foreground transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
              aria-expanded={openState.conditions}
            >
              <span>{t(lang, 'myHealth.conditionsTitle')}</span>
              <ChevronDown
                className={cn('h-4 w-4 text-muted-foreground transition-transform', openState.conditions && 'rotate-180')}
                aria-hidden
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="flex flex-col gap-3 pt-3">
            <p className="text-[11px] text-muted-foreground">
              {t(lang, 'myHealth.conditionsHint')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {CHRONIC_CONDITIONS.map((def) => {
                const active = draft.conditions.includes(def.id);
                return (
                  <button
                    key={def.id}
                    type="button"
                    onClick={() => toggleCondition(def.id)}
                    aria-pressed={active}
                    className={cn(
                      'inline-flex min-h-9 items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
                      active
                        ? 'border-primary bg-primary/12 text-primary'
                        : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
                    )}
                  >
                    {def.label[lang]}
                  </button>
                );
              })}
            </div>
            {draft.conditions.length > 0 ? (
              <div className="rounded-lg bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
                {draft.conditions.map((c) => conditionLabel(c, lang)).join(' · ')}
              </div>
            ) : null}
          </CollapsibleContent>
        </Collapsible>

        {/* Allergies */}
        <Collapsible open={openState.allergies} onOpenChange={() => toggle('allergies')}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-background/60 px-3 py-2.5 text-left text-sm font-bold text-foreground transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
              aria-expanded={openState.allergies}
            >
              <span>{t(lang, 'myHealth.allergiesTitle')}</span>
              <ChevronDown
                className={cn('h-4 w-4 text-muted-foreground transition-transform', openState.allergies && 'rotate-180')}
                aria-hidden
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="flex flex-col gap-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              {t(lang, 'myHealth.allergiesHint')}
            </p>
            <Textarea
              value={allergiesText}
              onChange={(e) => setAllergiesText(e.target.value)}
              placeholder={t(lang, 'myHealth.allergiesPlaceholder')}
              rows={3}
              className="resize-y text-sm"
              aria-label={t(lang, 'myHealth.allergiesTitle')}
            />
          </CollapsibleContent>
        </Collapsible>

        {/* Medications */}
        <Collapsible open={openState.meds} onOpenChange={() => toggle('meds')}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-background/60 px-3 py-2.5 text-left text-sm font-bold text-foreground transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
              aria-expanded={openState.meds}
            >
              <span>{t(lang, 'myHealth.medsTitle')}</span>
              <ChevronDown
                className={cn('h-4 w-4 text-muted-foreground transition-transform', openState.meds && 'rotate-180')}
                aria-hidden
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="flex flex-col gap-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              {t(lang, 'myHealth.medsHint')}
            </p>
            <Textarea
              value={medsText}
              onChange={(e) => setMedsText(e.target.value)}
              placeholder={t(lang, 'myHealth.medsPlaceholder')}
              rows={3}
              className="resize-y text-sm"
              aria-label={t(lang, 'myHealth.medsTitle')}
            />
          </CollapsibleContent>
        </Collapsible>

        {/* ICE contacts */}
        <Collapsible open={openState.ice} onOpenChange={() => toggle('ice')}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-background/60 px-3 py-2.5 text-left text-sm font-bold text-foreground transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
              aria-expanded={openState.ice}
            >
              <span>{t(lang, 'myHealth.iceTitle')}</span>
              <ChevronDown
                className={cn('h-4 w-4 text-muted-foreground transition-transform', openState.ice && 'rotate-180')}
                aria-hidden
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="flex flex-col gap-3 pt-3">
            <p className="text-[11px] text-muted-foreground">
              {t(lang, 'myHealth.iceHint')}
            </p>
            <div className="flex flex-col gap-3">
              {draft.iceContacts.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-col gap-2 rounded-xl border border-border bg-background/60 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-foreground">
                      {t(lang, 'myHealth.iceName')}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeIce(c.id)}
                      className="inline-flex h-7 items-center gap-1 rounded-full border border-red-500/25 bg-red-500/5 px-2 text-[11px] font-semibold text-red-700 hover:bg-red-500/15 dark:text-red-400 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                      aria-label={t(lang, 'myHealth.iceRemove')}
                    >
                      {t(lang, 'myHealth.iceRemove')}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                      <Label htmlFor={`ice-name-${c.id}`} className="text-[11px] font-medium text-muted-foreground">
                        {t(lang, 'myHealth.iceName')}
                      </Label>
                      <Input
                        id={`ice-name-${c.id}`}
                        value={c.name}
                        onChange={(e) => updateIce(c.id, { name: e.target.value })}
                        className="h-9 text-sm"
                        maxLength={80}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor={`ice-phone-${c.id}`} className="text-[11px] font-medium text-muted-foreground">
                        {t(lang, 'myHealth.icePhone')}
                      </Label>
                      <Input
                        id={`ice-phone-${c.id}`}
                        value={c.phone}
                        onChange={(e) => {
                          updateIce(c.id, { phone: e.target.value });
                          if (iceErrors[c.id]) {
                            setIceErrors((m) => {
                              const next = { ...m };
                              delete next[c.id];
                              return next;
                            });
                          }
                        }}
                        inputMode="tel"
                        type="tel"
                        className={cn(
                          'h-9 text-sm',
                          iceErrors[c.id] &&
                            'border-red-500/60 focus-visible:outline-red-500',
                        )}
                        aria-invalid={!!iceErrors[c.id]}
                        aria-describedby={iceErrors[c.id] ? `ice-err-${c.id}` : undefined}
                        maxLength={24}
                      />
                      {iceErrors[c.id] ? (
                        <p id={`ice-err-${c.id}`} className="text-[11px] font-medium text-red-700 dark:text-red-400">
                          {iceErrors[c.id]}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor={`ice-relation-${c.id}`} className="text-[11px] font-medium text-muted-foreground">
                      {t(lang, 'myHealth.iceRelation')}
                    </Label>
                    <Input
                      id={`ice-relation-${c.id}`}
                      value={c.relation ?? ''}
                      onChange={(e) => updateIce(c.id, { relation: e.target.value })}
                      className="h-9 text-sm"
                      maxLength={40}
                    />
                  </div>
                </div>
              ))}
              {draft.iceContacts.length < 3 ? (
                <button
                  type="button"
                  onClick={addIce}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-dashed border-primary/40 bg-primary/5 px-3 text-xs font-semibold text-primary transition-colors hover:bg-primary/12 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                  aria-label={t(lang, 'myHealth.iceAdd')}
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                  {t(lang, 'myHealth.iceAdd')}
                </button>
              ) : (
                <p className="text-center text-[11px] text-muted-foreground">
                  {t(lang, 'toast.iceLimit')}
                </p>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Save button */}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="h-10 gap-1.5 rounded-xl px-4 text-sm font-bold"
          >
            <Save className="h-4 w-4" aria-hidden />
            {saving ? t(lang, 'myHealth.saved') : t(lang, 'myHealth.save')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function isAnyProfileFieldSet(p: HealthProfile): boolean {
  return (
    p.ageBand !== 'undisclosed' ||
    p.sex !== 'undisclosed' ||
    p.conditions.length > 0 ||
    p.allergies.length > 0 ||
    p.medications.length > 0 ||
    p.pregnant ||
    p.iceContacts.some((c) => c.name.trim() || c.phone.trim())
  );
}
