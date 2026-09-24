# Project Architecture: Walid Rahman Portfolio

This document outlines the stabilized architecture and permanent development rules for the Walid Rahman Portfolio. This project is built for high stability, predictability, and maintainability.

## 1. Core Architecture Values
- **Deterministic Rendering**: UI must render from explicit fields, never from inferred logic or keyword matching.
- **Strict Schema Enforcement**: All data must adhere to TypeScript interfaces.
- **Sanitized Persistence**: No `undefined` values are ever written to Supabase. All payloads are normalized before save.
- **Graceful Fallbacks**: The frontend must handle missing or partial data without crashing.

## 2. Rendering Flow
1. **Fetch**: Data is pulled from Supabase using `getCollection`.
2. **Normalize (Frontend)**: In `App.tsx`, raw Supabase data is mapped to typed objects with safe fallbacks (empty strings for nulls, empty arrays for missing lists).
3. **Render**: Components consume the normalized data. They do NOT contain logic to "search" for features in text.

## 3. Admin & Data Pipeline
1. **Form Input**: Raw data is captured from the Admin Management Panel.
2. **Normalization Layer**: In `AdminDashboard.tsx`, the `normalizePayload` function converts form inputs into deterministic typed objects.
3. **Database Sanitization**: In `src/services/supabase.ts`, the `sanitizeData` utility recursively removes `undefined` values and normalizes object structures.
4. **Validation**: Critical fields (like names/titles) are validated before the write operation proceeds.

## 4. Pricing Section Structure
The pricing system is specifically hardened against stability drift:
- **Explicit Fields**: Uses `showPriorityBox`, `priorityTitle`, and `prioritySubtitle` for the highlight box.
- **Explicit Arrays**: `features` (Included) and `unavailableFeatures` (Excluded) are separate database fields.
- **No Keywords**: Component visibility is controlled by boolean toggles, never by checking for words like "Consultation".

## 5. Permanent Development Rules
- **No Keyword Logic**: Forbidden. Do not use `.includes()` or regex on content strings to determine UI behavior.
- **Schema First**: Update `types.ts` and `sql_schema.sql` before adding new features.
- **Sanitize Before Save**: Always pass payloads through the normalization helpers.
- **Component Isolation**: Keep admin logic, schema definitions, and presentation code separated.
- **Minimal Change**: Bias towards the smallest possible diff that achieves a goal.

## 7. Deployment & Safety Workflow (Permanent)
To protect the stable baseline, all future changes must follow this checklist:

1. **Local Validation**: Run `npm run lint` and `npm run build` to ensure zero compilation errors.
2. **Schema Audit**: If adding a new field, ensure it is added to `types.ts`, `sql_schema.sql`, and `src/lib/schema-defaults.ts`.
3. **Environment Isolation**: Testing should be performed in the Preview environment before merging into the production branch.
4. **CRUD Integrity**: Verify that creating, editing, and deleting an item in the Admin Dashboard works for the affected section.
5. **Responsive Check**: Verify UI rendering on both mobile and desktop (especially pricing boxes).

## 8. Rollback & Recovery Procedures
If a deployment or admin update corrupts the production state:

1. **Admin Recovery**: Use the Admin Dashboard to re-edit the corrupted document. The `normalizePayload` layer will automatically strip `undefined` values and re-apply defaults on the next save.
2. **Database Rollback**: If data is deleted, restore from the backup in Supabase.
3. **Code Rollback**: Revert the last Git commit to the `baseline-approved` tag.
4. **State Reset**: Clearing `localStorage` or browser cache may be required if hydration errors persist.

## 9. Future Development Constraints
- **Isolation**: New features must stay within their component boundaries. Do not leak logic from `Projects` into `Services`.
- **Minimal Abstraction**: Keep code readable. Prefer explicit fields over complex generic factories.
## 10. Technical Stack
- **Framework**: React 18+ with Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth (Google OAuth)
- **Animations**: Framer Motion
- **Icons**: Lucide React
