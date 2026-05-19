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
```

Form components may still pass legacy collection names such as `registrationForm` or `triageForm`. The bridge in `src/forms/formKeys.js` maps those names to backend form keys such as `registration` and `triage`.

`src/services/mongoDB.js` is now a compatibility facade. Existing callers can continue using helpers like `getSavedData`, `getSavedPatientData`, and `getPreRegDataById`, but the implementation prefers the newer domain routes where a form or patient mapping exists.

For new frontend work:

- Use `patientsApi`, `formsApi`, and `authApi` instead of direct `fetch('/api/...')`.
- Use `stationsApi.getPatientStationStatus` for dashboard completion status and `stationsApi.getPatientStationEligibility` for backend eligibility. The current timeline keeps local fallbacks while backend parity is being validated.
- Avoid passing MongoDB collection names from UI components when a domain key is available.
- Add new form collection-to-key mappings in `src/forms/formKeys.js`.
- Keep `services/mongoDB.js` compatibility behavior until old callers have been migrated.

## Past Versions

For reference:

- [2025 Website](https://phs-app-2025.vercel.app/login)
- [2024 Website](https://phs-app.vercel.app/login)
- [2023 Website](https://phs-app-gules.vercel.app/login)
