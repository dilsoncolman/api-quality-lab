# Lesson Review

AI-generated lesson suggestions are written to `proposed.jsonl` with the status `pending_human_review`. A human reviewer changes each reviewed proposal's status to `approved` or `rejected`, records `reviewedAt` and a short `reviewNote`, and copies approved lessons into `approved.md`.

`approved.md` is maintained by a person. Review the proposal and its test evidence before manually adding an approved lesson. The triage agent never edits this file, changes source code, or approves or rejects a proposal.
