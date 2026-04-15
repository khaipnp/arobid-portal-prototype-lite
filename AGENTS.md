## Learned User Preferences
- User expects implementations to be re-aligned against updated wiki specs when they say docs have changed.
- User expects all modules to migrate from `mock-data` to Neon-backed flows, and expects edits to persist after refresh.

## Learned Workspace Facts
- Chat service product specs are maintained under `wiki/Module/Core/Chat Service` and are used to drive `deal-room` behavior updates.
- The workspace has a Neon DB integration via `lib/db/neon.ts`, and eVoucher is expected to use DB access patterns instead of direct mock imports.
