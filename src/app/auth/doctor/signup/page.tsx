'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Eye, EyeOff, UserPlus, Upload, FileText, ShieldCheck, Stethoscope, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { AuthBrandHeading, AuthShell } from '@/components/auth/auth-shell';
import { cn } from '@/lib/utils';

const SPECIALTIES = [
  'Family Medicine', 'Internal Medicine', 'Cardiology', 'Pediatrics', 'Obstetrics & Gynecology',
  'Dermatology', 'Psychiatry', 'Orthopedics', 'ENT', 'Ophthalmology', 'General Surgery',
  'Pulmonology', 'Gastroenterology', 'Neurology', 'Urology', 'Nephrology', 'Endocrinology',
  'Oncology', 'Emergency Medicine', 'Anesthesiology', 'Radiology', 'Pathology',
];

const CITIES = [
  'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar',
  'Quetta', 'Hyderabad', 'Sialkot', 'Gujranwala', 'Bahawalpur', 'Sukkur', 'Abbottabad',
  'Mardan', 'Sargodha', 'Other',
];

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ur', label: 'اردو (Urdu)' },
  { code: 'roman', label: 'Roman Urdu' },
  { code: 'pa', label: 'پنجابی (Punjabi)' },
  { code: 'sd', label: 'Sindhi' },
  { code: 'ps', label: 'Pashto' },
];

const DOCTOR_CONSENT =
  'I confirm that the PMDC registration number and credentials provided are my own and are accurate. I understand that SehatAI is a documentation aid and does not make clinical decisions. I am responsible for all clinical decisions made for my patients. SehatAI may audit my usage of patient data. I may revoke patient access at any time.';

interface UploadedDoc {
  docType: string;
  file: File;
  previewUrl?: string;
  docId?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function DoctorSignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [pmdcNumber, setPmdcNumber] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [subSpecialty, setSubSpecialty] = useState('');
  const [facilityName, setFacilityName] = useState('');
  const [facilityCity, setFacilityCity] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [languages, setLanguages] = useState<string[]>(['en', 'ur']);
  const [bio, setBio] = useState('');
  const [consent, setConsent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [docs, setDocs] = useState<UploadedDoc[]>([]);

  const toggleLanguage = (code: string) => {
    setLanguages((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  };

  const handleDocSelect = (docType: string, file: File | null) => {
    if (!file) return;
    setDocs((prev) => {
      const without = prev.filter((d) => d.docType !== docType);
      return [...without, { docType, file, previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined }];
    });
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (submitting) return;
      // validation
      if (!EMAIL_RE.test(email.trim())) return toast.error('Enter a valid email address.');
      if (password.length < 8) return toast.error('Password must be at least 8 characters.');
      if (!name.trim()) return toast.error('Full name is required.');
      if (!/^[A-Z]{2,4}-\d{4,6}$/.test(pmdcNumber.trim().toUpperCase())) {
        return toast.error('PMDC number format: PMC-12345 (letters-hyphen-digits).');
      }
      if (!specialty) return toast.error('Select your specialty.');
      if (!consent) return toast.error('Please accept the doctor consent to continue.');
      if (docs.length === 0) return toast.error('Please upload at least your PMDC card.');

      setSubmitting(true);
      try {
        // 1) Create the doctor account
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
            name: name.trim(),
            consent: true,
            intendedRole: 'doctor',
            doctor: {
              pmdcNumber: pmdcNumber.trim().toUpperCase(),
              specialty,
              subSpecialty: subSpecialty.trim() || undefined,
              facilityName: facilityName.trim() || undefined,
              facilityCity: facilityCity || undefined,
              yearsExperience: yearsExperience ? Number(yearsExperience) : undefined,
              languages,
              bio: bio.trim() || undefined,
            },
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error ?? 'Could not create the account.');
          return;
        }

        // 2) Sign in immediately (account is pending_verification — can upload docs but not yet access portal)
        const result = await signIn('credentials', {
          email: email.trim().toLowerCase(),
          password,
          redirect: false,
        });
        if (!result || result.error) {
          // Account created but auto-login failed — direct to doctor signin
          toast.success('Account created. Please sign in to continue.');
          router.push('/auth/doctor/signin');
          return;
        }

        // 3) Upload verification docs
        if (docs.length > 0) {
          setUploadingDocs(true);
          for (const d of docs) {
            const fd = new FormData();
            fd.append('file', d.file);
            fd.append('docType', d.docType);
            try {
              await fetch('/api/doctor/upload-doc', { method: 'POST', body: fd });
            } catch {
              // non-blocking — user can re-upload later
            }
          }
          setUploadingDocs(false);
        }

        toast.success('Account created. Verification pending — typically 24-48 hours.');
        router.replace('/onboarding/doctor/pending');
        router.refresh();
      } catch {
        toast.error('Could not create the account. Please try again.');
      } finally {
        setSubmitting(false);
        setUploadingDocs(false);
      }
    },
    [bio, consent, docs, email, facilityCity, facilityName, languages, name, password, pmdcNumber, router, specialty, subSpecialty, yearsExperience, submitting],
  );

  return (
    <AuthShell variant="doctor">
      <AuthBrandHeading variant="doctor" />

      <Card className="border-emerald-200/60 bg-card/70 shadow-sm dark:border-emerald-900/40">
        <CardHeader className="gap-3 border-b border-border px-5 py-5 sm:px-6">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold tracking-tight text-foreground">Doctor Sign Up</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
              <ShieldCheck className="h-3 w-3" /> PMDC verification required
            </span>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Create your doctor account. We&apos;ll verify your PMDC registration before granting access to patient data.
            <span className="mt-1 block font-semibold text-foreground">Verification typically takes 24–48 hours.</span>
          </p>
        </CardHeader>

        <CardContent className="flex flex-col gap-5 px-5 py-5 sm:px-6">
          <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>

            {/* Account credentials */}
            <fieldset className="flex flex-col gap-3 rounded-xl border border-border bg-card/40 p-3">
              <legend className="px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Account</legend>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="dr-name" className="text-sm font-semibold">Full name *</Label>
                <Input id="dr-name" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. Ayesha Khan" className="h-11 rounded-xl" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="dr-email" className="text-sm font-semibold">Email *</Label>
                <Input id="dr-email" type="email" autoComplete="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="dr.khan@hospital.pk" className="h-11 rounded-xl" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="dr-password" className="text-sm font-semibold">Password (8+ characters) *</Label>
                <div className="relative">
                  <Input id="dr-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="h-11 rounded-xl pe-12" />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute end-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </fieldset>

            {/* Professional credentials */}
            <fieldset className="flex flex-col gap-3 rounded-xl border border-emerald-500/30 bg-emerald-50/40 p-3 dark:bg-emerald-950/10">
              <legend className="px-1 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Professional</legend>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pmdc" className="text-sm font-semibold">PMDC registration number *</Label>
                <Input id="pmdc" type="text" dir="ltr" value={pmdcNumber} onChange={(e) => setPmdcNumber(e.target.value.toUpperCase())} placeholder="PMC-12345" className="h-11 rounded-xl uppercase" />
                <p className="text-[10px] text-muted-foreground">Format: 2-4 letters, hyphen, 4-6 digits. e.g. PMC-12345, SMC-1234</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="specialty" className="text-sm font-semibold">Specialty *</Label>
                <Select value={specialty} onValueChange={setSpecialty}>
                  <SelectTrigger id="specialty" className="h-11 min-h-11 w-full rounded-xl"><SelectValue placeholder="Select specialty" /></SelectTrigger>
                  <SelectContent>
                    {SPECIALTIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="subspecialty" className="text-sm font-semibold">Sub-specialty (optional)</Label>
                <Input id="subspecialty" type="text" value={subSpecialty} onChange={(e) => setSubSpecialty(e.target.value)} placeholder="e.g. Interventional Cardiology" className="h-11 rounded-xl" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="facility" className="text-sm font-semibold">Primary facility</Label>
                  <Input id="facility" type="text" value={facilityName} onChange={(e) => setFacilityName(e.target.value)} placeholder="Aga Khan Hospital" className="h-11 rounded-xl" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="city" className="text-sm font-semibold">City</Label>
                  <Select value={facilityCity} onValueChange={setFacilityCity}>
                    <SelectTrigger id="city" className="h-11 min-h-11 w-full rounded-xl"><SelectValue placeholder="Select city" /></SelectTrigger>
                    <SelectContent>
                      {CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="experience" className="text-sm font-semibold">Years of experience</Label>
                  <Input id="experience" type="number" min={0} max={70} value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} placeholder="e.g. 8" className="h-11 rounded-xl" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm font-semibold">Languages spoken</Label>
                <div className="flex flex-wrap gap-1.5">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => toggleLanguage(l.code)}
                      className={cn(
                        'inline-flex min-h-9 items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                        languages.includes(l.code)
                          ? 'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                          : 'border-border bg-background text-muted-foreground hover:bg-accent',
                      )}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="bio" className="text-sm font-semibold">Short bio (optional, max 500 chars)</Label>
                <textarea
                  id="bio" rows={3} maxLength={500} value={bio} onChange={(e) => setBio(e.target.value)}
                  placeholder="Senior cardiologist with 10+ years experience at Aga Khan Hospital, Karachi."
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-ring"
                />
              </div>
            </fieldset>

            {/* Verification documents */}
            <fieldset className="flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-50/40 p-3 dark:bg-amber-950/10">
              <legend className="px-1 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Verification documents</legend>
              <p className="text-xs text-muted-foreground">Upload your PMDC card (required) + CNIC + medical degree (optional, but speeds up verification).</p>

              {[
                { type: 'pmdc_card', label: 'PMDC card *' },
                { type: 'cnic', label: 'CNIC (national ID)' },
                { type: 'degree', label: 'Medical degree' },
                { type: 'experience_letter', label: 'Experience letter (optional)' },
              ].map((d) => {
                const uploaded = docs.find((x) => x.docType === d.type);
                return (
                  <div key={d.type} className="flex items-center gap-3">
                    <span className="flex-1 text-sm font-semibold">{d.label}</span>
                    {uploaded ? (
                      <span className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                        <FileText className="h-4 w-4" /> {uploaded.file.name.slice(0, 30)}
                      </span>
                    ) : null}
                    <label className={cn(
                      'inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-semibold transition-colors hover:bg-accent',
                      uploaded && 'border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400',
                    )}>
                      <Upload className="h-3.5 w-3.5" /> {uploaded ? 'Replace' : 'Upload'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        className="sr-only"
                        onChange={(e) => handleDocSelect(d.type, e.target.files?.[0] ?? null)}
                      />
                    </label>
                  </div>
                );
              })}
            </fieldset>

            {/* Consent */}
            <fieldset className="flex flex-col gap-2 rounded-xl border border-primary/25 bg-primary/5 p-3">
              <legend className="px-1 text-sm font-bold text-foreground">Doctor consent</legend>
              <p className="text-xs leading-relaxed text-muted-foreground">{DOCTOR_CONSENT}</p>
              <label htmlFor="consent" className="mt-1 flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-border bg-background px-3 py-2.5 hover:bg-accent/50">
                <Checkbox id="consent" checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
                <span className="text-sm font-semibold text-foreground">I agree to the doctor consent terms.</span>
              </label>
            </fieldset>

            <Button
              type="submit"
              disabled={submitting || uploadingDocs}
              className="h-auto min-h-12 gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
            >
              {submitting || uploadingDocs ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {uploadingDocs ? 'Uploading documents…' : 'Creating account…'}</>
              ) : (
                <><UserPlus className="h-4 w-4" /> Create doctor account</>
              )}
            </Button>
          </form>

          <div className="flex flex-col items-center gap-2 border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">Already have a doctor account?</p>
            <Link
              href="/auth/doctor/signin"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-500/5 px-4 text-sm font-bold text-emerald-700 transition-colors hover:bg-emerald-500/12 dark:text-emerald-400"
            >
              <Stethoscope className="me-1.5 h-4 w-4" /> Doctor sign in
            </Link>
          </div>
        </CardContent>
      </Card>

      <p className="mt-3 text-center text-[11px] text-muted-foreground">
        Not a doctor?{' '}
        <Link href="/auth/signup" className="font-semibold text-primary hover:underline">Create a patient account →</Link>
      </p>
    </AuthShell>
  );
}
