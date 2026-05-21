# GDPR Art. 9 + Oman PDPL Compliance Checklist

For Phase 3d-i Face2Feel · also bridges to 3d-v final activation.

## Article 9 GDPR — Special Categories of Personal Data

Biometric data used to uniquely identify a natural person is "special category" data. Facial emotion data straddles this line:
- ✅ Emotion inference alone (happy/sad/angry probabilities) is NOT identification
- ❌ But facial landmarks COULD enable identification if persisted/transmitted
- ✅ Our pipeline NEVER persists landmarks (deleted within same animation frame)

**Legal basis chosen:** Article 9(2)(a) — explicit consent.

## Required Disclosures (must be present in /legal/biometric)

- [x] What data is processed (camera frames, landmarks, emotion vectors)
- [x] What data is retained (5-axis vector only, local browser only)
- [x] What is deleted immediately (frames, landmarks, raw emotions)
- [x] Where processing happens (100% browser-local, no cloud)
- [x] Legal basis (Art. 9(2)(a) explicit consent)
- [x] Default state OFF
- [x] Right to revoke
- [x] Right to access (DSAR → 3d-v)
- [x] Right to erasure
- [x] Open-source attribution

## Consent Quality Requirements

- [x] Freely given (default Off, no penalty for declining)
- [x] Specific (each channel separate)
- [x] Informed (disclosure page linked from consent UI)
- [x] Unambiguous (explicit radio button selection, not pre-ticked)
- [x] Easy to withdraw (Revoke button always visible when active)
- [x] Demonstrable (consent record with timestamp and version)

## Oman Personal Data Protection Law (Royal Decree 6/2022)

Additional requirements over GDPR:
- [ ] Arabic-language disclosure available (/ar/legal/biometric) — DELIVERED in 3d-i
- [ ] Data controller identity disclosed (Acuterium Technologies Inc., Muscat)
- [ ] Compliance officer contact (chairman@celebrity-global.com)
- [ ] Cross-border transfer notice (NONE — fully local processing)

## Phase 3d-v Closure Items (NOT in 3d-i)

- [ ] Postgres `consent_events` table (append-only ledger)
- [ ] `/api/dsar/export` endpoint (returns all PATHOS history as JSON)
- [ ] `/api/dsar/erase` endpoint (purges localStorage + Postgres)
- [ ] `/api/cron/sweep-blob` daily 03:00 UTC (730d retention)
- [ ] Activation flags flipped: `FACE2FEEL_ENABLED=true` etc.
- [ ] DPIA (Data Protection Impact Assessment) document filed

## In-flight Protection (during inference)

- [x] All inference in Web Worker (isolated from main thread)
- [x] `tf.dispose()` after every tensor operation
- [x] `tf.tidy()` wrapper around inference call
- [x] `ImageBitmap.close()` after worker consumes
- [x] postMessage payload contains ONLY PathosDelta + scalars
- [x] No network transmission of raw frames/landmarks/emotions
- [x] Camera resolution capped at 320×240
- [x] Frame rate capped at 5 fps
