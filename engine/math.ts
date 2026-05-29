export function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}

export function sigmoid(x: number): number {
  const z = clamp(x, -40, 40);
  return 1 / (1 + Math.exp(-z));
}

export function softplus(x: number): number {
  if (x > 40) return x;
  if (x < -40) return Math.exp(x);
  return Math.log1p(Math.exp(x));
}

// Fast smooth max/min for real-time use; epsilon has units of the operands.
export function smoothMax(a: number, b: number, eps = 0.25): number {
  return 0.5 * (a + b + Math.sqrt((a - b) * (a - b) + eps * eps));
}

export function smoothMin(a: number, b: number, eps = 0.25): number {
  return 0.5 * (a + b - Math.sqrt((a - b) * (a - b) + eps * eps));
}

export function solveQuadraticFlow(dP: number, R: number, B: number): number {
  const r = Math.max(R, 1e-9);
  const b = Math.max(B, 0);
  if (b < 1e-12) return clamp(dP / r, -1500, 1500);
  if (dP >= 0) {
    return clamp((-r + Math.sqrt(r * r + 4 * b * dP)) / (2 * b), -1500, 1500);
  }
  const x = (-r + Math.sqrt(r * r + 4 * b * -dP)) / (2 * b);
  return clamp(-x, -1500, 1500);
}

export function frac(x: number): number {
  return x - Math.floor(x);
}

export function raisedCosinePulse(theta: number, thetaOn: number, durationTheta: number, periodSeconds: number): number {
  const s = frac(theta - thetaOn + 1);
  if (durationTheta <= 0 || s >= durationTheta) return 0;
  // Integral over one beat is one.
  return (1 - Math.cos((2 * Math.PI * s) / durationTheta)) / (periodSeconds * durationTheta);
}

export function expClamped(x: number): number {
  return Math.exp(clamp(x, -50, 50));
}
