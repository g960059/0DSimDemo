# Runner verification correction before contrast-v2

All four contrast-v1 jobs reached the inherited periodic tolerance. The runner
then rejected checkpoint comparisons using raw JSON.stringify, which treats
object insertion order as significant. The exact checkpoint test's structural
comparison passed. Replaced the runner comparison with canonical JSON of all
fields/hashes; the four three-cycle checkpoint-smoke-v2 jobs now roundtrip and
replay. No equation, coefficient, initial state, stopping tolerance or time
step changed. Preserve contrast-v1 as a partial-record runner failure.

Repeat the prespecified four jobs into contrast-v2 to retain complete final
measurement and material-replay artifacts. Existing v1 beat/trace output will
be compared against v2; differing source hashes reflect runner verification,
not a numerical model change.
