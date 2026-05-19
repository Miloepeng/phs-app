## Note to collaborators

Remember to do these: 

- Download the `.env` file into your project folder & do not upload the file into the repository.
- Execute: `npm install` before running `npm run dev` whenever you pull any changes.

## Frontend Structure Notes

The frontend is being migrated away from direct MongoDB/collection terminology and toward domain API modules.

Prefer these API wrappers for new code:

```text
src/api/apiClient.js     # Shared HTTP client and auth headers
src/api/authApi.js       # Login, signup, account deletion, password reset
src/api/formsApi.js      # Patient form reads and submissions
src/api/patientsApi.js   # Patient creation, lookup, names, and search
src/api/stationsApi.js   # Patient station completion status and eligibility
src/reports/doctorPdf.js # Doctor consult PDF generation
src/reports/formAPdf.js  # Form A PDF generation
src/reports/patientReportPdf.js # Legacy patient report PDF generation
src/reports/patientReportPdfUpdated.js # Current patient report PDF generation
src/reports/pdfMake.js   # Shared pdfMake setup
src/services/stationParity.js # Dev-only backend/frontend eligibility comparison helper
```

Form components may still pass legacy collection names such as `registrationForm` or `triageForm`. The bridge in `src/forms/formKeys.js` maps those names to backend form keys such as `registration` and `triage`.

`src/services/mongoDB.js` is now a compatibility facade. Existing callers can continue using helpers like `getSavedData`, `getSavedPatientData`, and `getPreRegDataById`, but the implementation prefers the newer domain routes where a form or patient mapping exists.

For new frontend work:

- Use `patientsApi`, `formsApi`, and `authApi` instead of direct `fetch('/api/...')`.
- Use `stationsApi.getPatientStationStatus` for dashboard completion status and `stationsApi.getPatientStationEligibility` for backend eligibility. The current timeline keeps local fallbacks while backend parity is being validated.
- In development, the dashboard logs station eligibility mismatches found by `stationParity.js`, including the patient ID, per-station differences, and each side's eligible station list.
- Avoid passing MongoDB collection names from UI components when a domain key is available.
- Add new form collection-to-key mappings in `src/forms/formKeys.js`.
- Keep `services/mongoDB.js` compatibility behavior until old callers have been migrated.
- `src/services/stationCounts.js` still exposes compatibility helpers. `updateAllStationCounts` now prefers backend eligibility and falls back to local rules.

Stage 7D keeps backend eligibility as parity-in-progress. Frontend fallbacks remain in place, and mismatch logging is diagnostic only; do not remove local eligibility logic until representative patient timelines have been checked without mismatches.

Stage 8 starts extracting report/PDF responsibilities from `src/api/api.jsx`. `generateDoctorPdf` now lives in `src/reports/doctorPdf.js`, with `src/api/api.jsx` re-exporting it as a compatibility facade so existing callers keep working.

Stage 9 continues that report extraction. `generateFormAPdf` and its private Form A rendering helpers now live in `src/reports/formAPdf.js`, with `src/api/api.jsx` re-exporting it as a compatibility facade for existing callers.

Stage 10A moves the legacy `generate_pdf` jsPDF report and its direct rendering helpers into `src/reports/patientReportPdf.js`. `src/api/api.jsx` continues to re-export those helpers as a compatibility facade for existing callers.

Stage 10B moves `generate_pdf_updated` and its direct pdfMake section helpers into `src/reports/patientReportPdfUpdated.js`. `src/api/api.jsx` continues to re-export those helpers as a compatibility facade for existing callers.

## Past Versions

For reference:

- [2025 Website](https://phs-app-2025.vercel.app/login)
- [2024 Website](https://phs-app.vercel.app/login)
- [2023 Website](https://phs-app-gules.vercel.app/login)
