# Stopped mislabeled fine-resolution request

The request named length0.8-passive1.248-Ca1.1-1ms mistakenly put
nominalDtSec in the job JSON. This runner takes resolution exclusively from
the --dt-sec CLI option, which remained0.002; it ignores that unknown JSON
field. The process command and actual protocol exposed the mismatch.

The wrongly labeled worker PID72054 was stopped with SIGTERM before it wrote
a result. Do not use that request as a1ms observation. The parallel reserve
worker correctly uses2ms and was left running. Its result remains valid.

The corrected fine run is a separate directory candidate-fine-v1, invoked
with --dt-sec .001 and a job containing no nominalDtSec property. Final
analysis must verify the nominalDtSec in the result itself, never infer it
from a filename or requested job label. No completed scientific data were
deleted or overwritten.
