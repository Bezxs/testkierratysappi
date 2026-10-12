# Mobile boundary

Read the repository-root AGENTS.md and project-control files first.
This area owns UI, device permissions, local state, presentation and localization.
Use only mobile packages and shared public exports; do not import backend code,
database clients, provider shapes or secrets. Never duplicate the shared models,
rule engine or lookup protocol to avoid a dependency.

For mobile-only work, keep implementation changes here. Shared/root changes need
an explicitly coordinated task. Run `pnpm validate:mobile`, then full
`pnpm validate` before completion. Preserve source/licence/uncertainty, safe
failures, localization, accessibility and privacy. Browser evidence is not
physical-device evidence. Do not push without explicit owner authorization.
