#!/usr/bin/env python3
"""Generate the independent high-precision Appendix A/C regression payload.

This script deliberately uses only Python's standard-library Decimal direct
logarithmic formulas. It does not import or reproduce the TypeScript runtime
series implementation. The checked-in payload SHA is computed from the compact,
key-sorted JSON emitted on stdout.
"""

from __future__ import annotations

import argparse
from decimal import Context, Decimal, ROUND_HALF_EVEN, localcontext
from hashlib import sha256
import json
from pathlib import Path
import sys


REFERENCE_ID = "lumens-2009-appendix-ac-stabilized-analytical-reference-v1"
PACK_SCHEMA_ID = "stabilized-triseg-appendix-ac-high-precision-pack-v1"
PRECISION_DIGITS = 180
PRECISION_STABILITY_AUDIT_DIGITS = 240
SERIALIZED_SIGNIFICANT_DIGITS = 80
CONTEXT = Context(prec=PRECISION_DIGITS, rounding=ROUND_HALF_EVEN)
AUDIT_CONTEXT = Context(prec=PRECISION_STABILITY_AUDIT_DIGITS, rounding=ROUND_HALF_EVEN)


VECTORS = (
    ("flat-reference", "0.003", "0.003", "0", "0"),
    ("flat-area-only", "0.00363", "0.003", "0", "0"),
    ("near-zero-positive", "0.00291", "0.003", "1e-20", "1e-20"),
    ("near-zero-negative", "0.00291", "0.003", "-1e-20", "-1e-20"),
    ("series-switch-below", "0.003", "0.0031", "0.124999999999", "0.124999999999"),
    ("series-switch-above", "0.0032", "0.003", "0.125000000001", "0.125000000001"),
    ("moderate-positive", "0.004", "0.004", "0.2", "0.4"),
    ("moderate-negative", "0.004", "0.004", "-0.2", "-0.4"),
    ("distinct-x-z", "0.0035", "0.003", "0.05", "0.6"),
    ("diagnostic-envelope-edge", "0.0042", "0.0038", "0.4", "0.79"),
    ("analytical-domain-edge", "0.0028", "0.0032", "0.9", "0.99"),
)


def d(value: str, context: Context) -> Decimal:
    return context.create_decimal(value)


def g_minus_two(argument: Decimal, context: Context) -> Decimal:
    absolute = abs(argument)
    if absolute.is_zero():
        return Decimal(0)
    one = Decimal(1)
    with localcontext(context):
        return (
            ((one + absolute) * (one + absolute).ln())
            - ((one - absolute) * (one - absolute).ln())
        ) / absolute - Decimal(2)


def atanh_over_argument(argument: Decimal, context: Context) -> Decimal:
    absolute = abs(argument)
    if absolute.is_zero():
        return Decimal(1)
    one = Decimal(1)
    with localcontext(context):
        return ((one + absolute).ln() - (one - absolute).ln()) / (Decimal(2) * absolute)


def c5a_strain_derivative_by_area(
    area: Decimal,
    thickness_curvature_ratio: Decimal,
    context: Context,
) -> Decimal:
    """Differentiate normalized C5a at fixed C_m and V_w.

    This deliberately follows a different equation path from Appendix A4.  At
    fixed curvature and wall volume, x is constant and dz/dA_m = -z/A_m.
    G'(z) is evaluated by differentiating its direct-log definition.
    """
    z = thickness_curvature_ratio
    with localcontext(context):
        if z.is_zero():
            return Decimal(1) / (Decimal(2) * area)
        one = Decimal(1)
        numerator = (one + z) * (one + z).ln() - (one - z) * (one - z).ln()
        g_prime = (
            z * ((one - z * z).ln() + Decimal(2)) - numerator
        ) / (z * z)
        return Decimal(1) / (Decimal(2) * area) - z * g_prime / (Decimal(4) * area)


def a4_tension_per_wall_volume_stress(
    area: Decimal,
    thickness_curvature_ratio: Decimal,
    context: Context,
) -> Decimal:
    """Evaluate Appendix A4 directly, independently of the C5a derivative."""
    with localcontext(context):
        return atanh_over_argument(thickness_curvature_ratio, context) / (Decimal(2) * area)


def assert_independent_work_conjugacy(
    strain_derivative: Decimal,
    tension_factor: Decimal,
    context: Context,
    vector_id: str,
) -> None:
    with localcontext(context):
        relative_residual = abs(strain_derivative - tension_factor) / abs(tension_factor)
        tolerance = Decimal(10) ** (-(context.prec - 20))
    if relative_residual > tolerance:
        raise ArithmeticError(
            f"independent C5a/A4 work-conjugacy audit failed for {vector_id}: "
            f"relative residual {relative_residual} > {tolerance}"
        )


def serialize(value: Decimal, context: Context) -> str:
    with localcontext(context):
        return format(value, f".{SERIALIZED_SIGNIFICANT_DIGITS}g")


def build_vector(
    vector_id: str,
    midwall_area: str,
    reference_area: str,
    x_value: str,
    z_value: str,
    context: Context,
) -> dict[str, object]:
    area = d(midwall_area, context)
    area_ref = d(reference_area, context)
    x = d(x_value, context)
    z = d(z_value, context)
    if area <= 0 or area_ref <= 0 or abs(x) >= 1 or abs(z) >= 1:
        raise ValueError(f"invalid vector domain: {vector_id}")
    if (x.is_zero() and not z.is_zero()) or (z.is_zero() and not x.is_zero()) or x * z < 0:
        raise ValueError(f"x and z must represent one signed-curvature branch: {vector_id}")

    with localcontext(context):
        gx = g_minus_two(x, context)
        gz = g_minus_two(z, context)
        atanh_factor = atanh_over_argument(z, context)
        strain = (area / area_ref).ln() / Decimal(2) - gx / Decimal(12) + gz / Decimal(4)
        area_derivative = c5a_strain_derivative_by_area(area, z, context)
        tension_factor = a4_tension_per_wall_volume_stress(area, z, context)
    assert_independent_work_conjugacy(area_derivative, tension_factor, context, vector_id)

    return {
        "id": vector_id,
        "input": {
            "midwallAreaM2": midwall_area,
            "referenceMidwallAreaM2": reference_area,
            "sourceSphereCurvatureVariableX": x_value,
            "thicknessCurvatureRatioZ": z_value,
        },
        "expected": {
            "gXMinusTwo": serialize(gx, context),
            "gZMinusTwo": serialize(gz, context),
            "atanhOverZ": serialize(atanh_factor, context),
            "fiberLogStrain": serialize(strain, context),
            "strainDerivativeByMidwallAreaAtFixedCurvaturePerM2": serialize(
                area_derivative,
                context,
            ),
            "tensionPerWallVolumeStressPerM2": serialize(tension_factor, context),
        },
    }


def build_vectors(context: Context) -> list[dict[str, object]]:
    return [build_vector(*vector, context) for vector in VECTORS]


def build_payload(vectors: list[dict[str, object]]) -> dict[str, object]:
    return {
        "schemaId": PACK_SCHEMA_ID,
        "referenceId": REFERENCE_ID,
        "sourceDoi": "10.1007/s10439-009-9774-2",
        "sourceEquations": ["A4", "A6", "C5a", "C6", "C7"],
        "normalization": (
            "remove C5a's first two constant terms, then remove the remaining +1/3 by "
            "centering both G contributions at G(0)=2; the flat-wall limit is "
            "0.5*ln(Am/Amref)"
        ),
        "arithmetic": {
            "engine": "python-stdlib-decimal-direct-log-formulas",
            "precisionDecimalDigits": PRECISION_DIGITS,
            "precisionStabilityAuditDecimalDigits": PRECISION_STABILITY_AUDIT_DIGITS,
            "serializedSignificantDigits": SERIALIZED_SIGNIFICANT_DIGITS,
            "rounding": "ROUND_HALF_EVEN",
            "runtimeSeriesImplementationImported": False,
            "strainDerivativeEquationPath": "differentiate-normalized-c5a-via-direct-g-prime",
            "tensionEquationPath": "appendix-a4-direct-atanh-over-z",
        },
        "vectors": vectors,
    }


def canonical_payload_bytes() -> tuple[bytes, str]:
    vectors = build_vectors(CONTEXT)
    audit_vectors = build_vectors(AUDIT_CONTEXT)
    if vectors != audit_vectors:
        raise ArithmeticError(
            f"{SERIALIZED_SIGNIFICANT_DIGITS}-digit serialization is not stable between "
            f"{PRECISION_DIGITS}- and {PRECISION_STABILITY_AUDIT_DIGITS}-digit evaluation"
        )
    payload = build_payload(vectors)
    canonical = json.dumps(payload, ensure_ascii=False, separators=(",", ":"), sort_keys=True)
    canonical_bytes = (canonical + "\n").encode("utf-8")
    return canonical_bytes, sha256(canonical.encode("utf-8")).hexdigest()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    destination = parser.add_mutually_exclusive_group()
    destination.add_argument("--check", type=Path, metavar="PACK")
    destination.add_argument("--write", type=Path, metavar="PACK")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    canonical_bytes, canonical_sha = canonical_payload_bytes()
    if args.check is not None:
        checked_bytes = args.check.read_bytes()
        if checked_bytes != canonical_bytes:
            raise SystemExit(
                f"generated Appendix-A/C pack differs byte-for-byte from {args.check}"
            )
        print(json.dumps({
            "byteForByteMatch": True,
            "canonicalSha256": canonical_sha,
            "checkedPath": str(args.check),
            "precisionDecimalDigits": PRECISION_DIGITS,
            "precisionStabilityAuditDecimalDigits": PRECISION_STABILITY_AUDIT_DIGITS,
            "serializedSignificantDigits": SERIALIZED_SIGNIFICANT_DIGITS,
        }, separators=(",", ":"), sort_keys=True))
        return
    if args.write is not None:
        args.write.write_bytes(canonical_bytes)
        print(f"sha256={canonical_sha}", file=sys.stderr)
        return
    sys.stdout.buffer.write(canonical_bytes)
    print(f"sha256={canonical_sha}", file=sys.stderr)


if __name__ == "__main__":
    main()
