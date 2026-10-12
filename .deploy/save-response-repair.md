# Generator save response repair

Reported symptom: the generator lesson edit dialog displayed
`保存失敗：Unexpected end of JSON input` after pressing `変更を保存`.
Read-only production inspection found schedule and state update timestamps
preceding the screenshot. This supports a possible partial save; it does not
identify the failed API, establish a PHP fatal error, or prove the original cause.
The original failed request and historical server log were not available.

The generator now names the failing save stage and retains the draft. Once a
schedule response is confirmed, retrying later stages skips that schedule write.
Unknown schedule responses block blind resubmission and offer a read-only status
check. Neither an empty response nor successful HTTP status proves a saved write.
Single lesson additions have actor-scoped idempotency receipts. Linked additions
retain their existing idempotency mechanism and gain a read-only status check.

Same-origin API writes reject empty, malformed, and unknown-outcome responses
without automatically resending. The relevant PHP save endpoints provide a JSON
failure response on exceptions, empty/HTML output, and memory fatal errors, with
a bounded diagnostic reference written to the normal server error log.
Existing login, CSRF, conflict confirmation, and teacher permissions remain.

Validation uses isolated synthetic PHP data and headless browser profiles.
Production verification is read-only; no test learners or lessons are added.
The original failing production save cannot be declared reproduced or cured;
the verified recovery behavior permits normal saves and handles unknown results
without discarding inputs or silently duplicating lessons.
