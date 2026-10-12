# Student NG intervals

Administrators open **NG日時** beside a learner in student management. They can
add, edit, and remove intervals in Japan time, including full days and intervals
crossing midnight. The end is exclusive: a lesson starting exactly at the NG end
does not overlap. Duplicate intervals do not create another entry. Concurrent
updates require refreshing the list; drafts remain available after a save error.

Registering an NG does not rewrite, move, cancel, or mark any existing lesson.
Before adding/moving/resizing lessons, changing rosters/invitations/exemptions,
linking periods, repeating/copying lessons, or replacing the full schedule, the
server checks the proposed schedule and effective roster. Warnings happen before
the operation writes data. Explicit continuation is bound to the confirmed
conflict revision; changed conflicts require a new confirmation. Linked periods
include the union of invited students, while preserving the real period records.
Inactive, hidden, and exempt students follow existing roster rules. Administrative
NG notes are omitted from warning messages.

NG data is stored in a PHP-guarded file under the existing protected data folder.
Teacher and anonymous callers cannot read or change the management API. No new
authentication mechanism, ACL, or access-policy migration is introduced.

This change retains commit 2df88a907e730591083e3cd8c6acd72b15f3fc42's draft
retention, unknown-response checks, idempotency, and PHP response fallback.
That earlier save incident's exact failing API and original cause remain unknown;
the NG validation has produced no new evidence about the historical incident.
All write tests use isolated synthetic data. Production checks are read-only.
