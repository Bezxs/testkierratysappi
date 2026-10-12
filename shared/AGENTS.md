# Shared boundary

Read the repository-root AGENTS.md and project-control files first.
This area owns pure domain models, runtime contracts and sorting policy.
Never depend on mobile/backend, native UI, HTTP provider implementations,
database runtime or secrets. Use public exports; no relative cross-package
source imports. Preserve v1 consumer compatibility rather than silently renaming
or removing wire fields. Do not duplicate schemas in consumers.

Rule changes preserve authoritative source, jurisdiction, checked date, version,
verification, confidence and explanation; unknown remains explicit. Run
`pnpm validate:shared` AND full `pnpm validate` for both consumers. Shared
changes can intentionally affect them; do not promise perfect isolation.
Do not push without explicit owner authorization.
