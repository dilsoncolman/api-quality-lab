# Bug Report: Whitespace-Only Task Titles Are Accepted

**ID:** BUG-001  
**Status:** Fixed and verified  
**Severity:** Medium

## Summary

The task creation endpoint accepted a title containing only whitespace and returned `201 Created`. A title that is empty after trimming must be rejected.

## Environment

- Windows PowerShell 5.1
- Node.js 24.20.0
- Playwright Test 1.64.1
- Local API bound to `127.0.0.1`

## Steps to reproduce

1. From the project root, run:

   ```powershell
   npm.cmd test -- tests/api/tasks.spec.js -g "rejects a whitespace-only title"
   ```

2. The isolated test sends `POST /tasks` with this JSON body:

   ```json
   {
     "title": "  \t  "
   }
   ```

## Expected result

The API returns `400 Bad Request` with the standard error envelope and error code `INVALID_TASK_TITLE`.

## Observed result

The API returned `201 Created`. The failing assertion recorded `Expected: 400` and `Received: 201`, showing that the whitespace-only title was accepted.

## Evidence

- Playwright test: `tests/api/tasks.spec.js`, test `rejects a whitespace-only title`.
- Captured Playwright JSON report: `artifacts/run-history/2026-10-31-whitespace-title-defect.json`.
- Console evidence: `Expected: 400` / `Received: 201`.

## Root cause

The defect demonstration checked whether the untrimmed title was empty. A whitespace-only string is truthy, so it passed validation. The value was trimmed only when the task was stored, leaving an empty title in the created task.

## Resolution

The API now trims the title before validating it and stores that validated value. The existing whitespace-only test remains as the regression test.

## Regression verification

After the fix, `npm.cmd test` completed with **11 passed**. The `rejects a whitespace-only title` regression test passed as part of the full suite. The post-fix Playwright report is preserved at `artifacts/run-history/2026-10-31-post-fix-regression.json`.
