# Scripts

Use this folder for operational and development scripts.

## Conventions

- `scripts/dev/` — local debugging and analysis helpers.
- `scripts/ci/` — deterministic scripts for CI pipelines.
- Prefer idempotent scripts with clear stdout and non-zero exit on failure.
- Keep scripts parameterized (flags/env vars), avoid hardcoded local paths.
