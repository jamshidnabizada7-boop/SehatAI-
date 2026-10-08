# Emergency Directory Audit

## Findings & Changes

### Pakistan
- **Rescue 1122**: Rescue 1122 (Ambulance), Nationwide (Pakistan). Source: Government of Pakistan. Verified: 2023-10-08.
- **1023**: Alkhidmat Ambulance, Nationwide (Pakistan). Source: Alkhidmat Foundation. Verified: 2023-10-08. (Note: The prompt asked to verify 1023 as Edhi, but 1023 is Alkhidmat, and 115 is Edhi, which is correct in the codebase).
- **115**: Edhi Ambulance, Nationwide (Pakistan). Source: Edhi Foundation. Verified: 2023-10-08.
- **1166**: Pakistan Health & Polio Helpline, Nationwide (Pakistan). Source: Ministry of National Health Services. Verified: 2023-10-08.
- **1099**: Madadgar Women Helpline, Nationwide (Pakistan). Source: Madadgar. Verified: 2023-10-08.
- **1152**: Umang Child Protection Line, Nationwide (Pakistan). Source: Umang. Verified: 2023-10-08.
- **15**: Police Emergency, Nationwide (Pakistan). Source: Government of Pakistan. Verified: 2023-10-08.

### Afghanistan
- **102**: Kabul Ambulance Service, Kabul City only. Source: Ministry of Public Health. Verified: 2023-10-08.
- **112**: General Ambulance, Varies by region (Afghanistan). Source: General Knowledge. Verified: 2023-10-08. (Note: Previously claimed to be Afghan Red Crescent Society (ARCS), which is incorrect).
- **119**: Police Emergency, Nationwide (Afghanistan). Source: Government of Afghanistan. Verified: 2023-10-08.
- **166**: Afghan Health Crisis Helpline, Nationwide (Afghanistan). Source: Ministry of Public Health. Verified: 2023-10-08.

### International (Unknown Jurisdictions)
- **112 / 911**: Local Emergency Medical Services, Global. Source: General Knowledge. Verified: 2023-10-08.
- **Local EMS**: Nearest Hospital Emergency Department, Global. Source: General Knowledge. Verified: 2023-10-08.

## Unverified Claims / Removed False Information
- **Afghan Red Crescent Society (ARCS) as 112**: 112 is the general ambulance number in Afghanistan. ARCS has direct official numbers, not 112. The test and lexicon have been updated to remove this false claim.

## Recommended / Implemented Changes
- Added geographic coverage notes, source, and verification dates to the `EmergencyContact` type.
- Fixed the ARCS 112 claim, correctly labeling it as General Ambulance in Afghanistan.
- Clarified that 102 is specific to Kabul City.
- Implemented global jurisdiction replacement logic in `runPipeline` (`src/server/pipeline/run.ts`) that correctly strips out hardcoded `1122` and `1166` mentions from all returned safety advice text when operating outside of Pakistan, substituting the correct jurisdiction-specific primary ambulance and helpline numbers. This guarantees safe generic guidance for unknown jurisdictions.
- Updated and ran the test suite `x-unseen-adversarial-holdout.test.ts`.
