# API Quality Lab — Test Plan

## 1. Purpose

This plan defines the expected behavior and verification approach for a small local REST API that manages tasks. It is written before the API implementation so that expected behavior can guide both development and test design.

## 2. System under test

- A local Node.js HTTP API that stores tasks in memory.
- Playwright Test API requests used to verify the HTTP contract.
- A local triage script that reads Playwright's JSON report and may ask Ollama's local `qwen3:1.7b` model for analysis.

The task API uses Node.js built-in modules. `@playwright/test` is the only planned development dependency for test automation.

## 3. Quality objectives

1. Return a predictable JSON envelope for successful and unsuccessful API responses.
2. Use HTTP status codes that distinguish successful operations, invalid input, and missing resources.
3. Reject missing, empty, and whitespace-only task titles.
4. Verify that response headers and task values match the documented contract.
5. Make every test independent of execution order and data left by earlier tests.
6. Demonstrate defect detection with one controlled bug, record evidence, fix it, and keep a regression test.
7. Keep AI analysis advisory: it may suggest a lesson, but a person must approve it before it enters the approved lessons file.

## 4. API contract baseline

Every successful JSON response uses this envelope:

```json
{
  "data": {
    "id": "<task-id>",
    "title": "Review API contract",
    "completed": false,
    "createdAt": "2026-10-31T09:00:00.000Z"
  },
  "error": null
}
```

For errors, `data` is `null` and `error` contains a stable `code` and a human-readable `message`:

```json
{
  "data": null,
  "error": {
    "code": "INVALID_TASK_TITLE",
    "message": "Task title is required."
  }
}
```

The expected error codes are `INVALID_JSON` for malformed JSON, `INVALID_TASK_TITLE` for a missing or blank title, `TASK_NOT_FOUND` for an unknown task ID, and `ROUTE_NOT_FOUND` for an unsupported route.

| Operation | Request | Expected success | Expected error behavior |
| --- | --- | --- | --- |
| List tasks | `GET /tasks` | `200`; `data` is an array | N/A |
| Create task | `POST /tasks` with a non-empty `title` | `201`; `data` is the created task | `400` for malformed JSON or a missing, empty, or whitespace-only title |
| Complete task | `PATCH /tasks/{id}/complete` | `200`; returned task has `completed: true` | `404` when the task ID does not exist |
| Delete task | `DELETE /tasks/{id}` | `200`; `data` is the deleted task | `404` when the task ID does not exist |

All responses, including errors, must have a JSON `Content-Type`. A task has an `id`, a trimmed `title`, a boolean `completed` value, and an ISO 8601 `createdAt` value. Newly created tasks start with `completed: false`.

## 5. In-scope coverage

- Basic response envelope and content type for success and error responses.
- Listing tasks, including a newly created task.
- Creating a valid task and checking its returned values.
- Rejecting a malformed JSON request body.
- Missing, empty, and whitespace-only titles.
- Completing a task created by the same test.
- Deleting a task created by the same test.
- Completing or deleting IDs that do not exist.
- Repeatability when tests run alone, in a different order, or together.
- One intentionally introduced title-validation defect, its bug report, its fix, and its regression result.
- Triage classifications: `application_bug`, `test_issue`, `environment_issue`, and `unknown`.

## 6. Test isolation and test data

Each API test will start a fresh server instance with an empty in-memory task store on an available loopback port. Tests that need a task will create it during that test and use the returned ID. Each server will be closed after its test. Tests must not depend on a shared task list, a fixed execution order, or files left by earlier runs.

## 7. Execution and evidence

Playwright Test will write a JSON report for the triage agent. The report is evidence for analysis, not permission to change source code. The triage output will include a classification, supporting evidence from the report, and a suggested next step. It will not edit application or test files.

Run history will be stored separately from AI lesson proposals. Approved lessons will be stored in a separate file and added only through a human review step.

## 8. Entry and exit criteria

### Entry criteria

- Node.js and npm are available.
- Project dependencies are installed from the project manifest.
- The test plan and expected API contract are available in the repository.

### Exit criteria

- The documented API contract tests pass after the intentional defect is fixed.
- The intentional failure has a reproducible test and an English bug report with expected behavior, observed behavior, reproduction steps, and evidence.
- Tests remain isolated and repeatable.
- The triage agent reports a supported classification and evidence, with a graceful explanation when Ollama is unavailable.
- AI lesson proposals remain separate from human-approved lessons.

## 9. Out of scope and limitations

- Authentication, authorization, persistence, deployment, and hosted services.
- Browser UI testing, performance testing, and external integrations.
- Treating an LLM classification as a test result or release decision.
- Automatic source changes or automatic approval of AI-proposed lessons.

The task data is temporary and is lost when a server instance stops. Ollama is optional at runtime; if its local service or the configured model is unavailable, triage must still produce a non-LLM result and explain the limitation.
