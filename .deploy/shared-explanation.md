# Shared teaching/explanation completion

Teachers check one homework item to record that its lesson or explanation is
complete. No learner picker is used. Relevant teacher and student displays share
that state; students and guardians can read it, while authenticated staff retain
the existing permission to change lesson records. Unchecked items carry forward.

Shared status is separate from personal completion/submission history. The
existing personal PHP store and old record checks remain intact and are not
promoted into explanation completion. The personal API compatibility view is
explicit; the new student UI does not migrate browser completion or send private
completion writes. Hiding remains a local display preference.

Each assignment has a stable item identity. Editing an existing input row or
reordering it preserves its identity. Removing it and adding a new row creates a
new identity, even for the same text. Linked periods use the full common record
metadata, not the text-only public projection. Separate unlinked assignments do
not become complete merely because their text matches. Optimistic revisions
reject stale concurrent changes, and cancellation updates the shared state.

The protected explanation store is written with a PHP guard. First-check identity
seeding is transactional and preserves the revision of an already open editor;
ordinary status changes do not rewrite lesson records. Existing individual
history, common lesson records, attendance, draft retention, save-response
fallback, idempotency, and student NG are retained.

Validation uses synthetic data in isolated PHP servers and headless PC/mobile
profiles. Production verification is read-only. The exact cause of the previous
production empty-response save incident remains unconfirmed.
