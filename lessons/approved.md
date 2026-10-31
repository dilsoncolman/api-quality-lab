# Human-Approved QA Lessons

## Reject whitespace-only task titles

- **Proposal ID:** `562e611c0087934d`
- **Approved on:** 2026-10-31
- **Lesson:** Ensure the API endpoint correctly handles whitespace-only titles by returning 400 status code and providing appropriate error messages.
- **Evidence:** Before the fix, `POST /tasks` accepted a whitespace-only title with `201 Created`. The regression test now expects `400 Bad Request` and `INVALID_TASK_TITLE`.
