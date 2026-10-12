# Backend boundary

Read the repository-root AGENTS.md and project-control files first.
This area owns API, provider adapters, resolution/cache and database migrations.
Use only backend packages and shared public exports; never import mobile/UI code.
Preserve the versioned HTTP protocol, validation, deadlines, quotas, input/output
GTIN binding and privacy-safe logging. Credentials stay server-side and must not
be read, printed or committed. Schema tests do not prove a deployed database.

For backend-only work, keep implementation changes here. Shared/root changes need
an explicitly coordinated task. Run `pnpm validate:backend`, then full
`pnpm validate` before completion. Do not migrate production, buy services,
change accounts or push without required explicit owner authorization.
