/** Deterministic 32-bit hash noise in [0,1). No Math.random anywhere in the
 *  engine, so the same date always produces the same number, in every browser
 *  and in the test runner. */
export function h32(a: number, b: number, c: number): number {
  let x =
    (Math.imul(a, 374761393) + Math.imul(b, 668265263) + Math.imul(c, 2246822519)) >>> 0
  x = Math.imul(x ^ (x >>> 13), 1274126177) >>> 0
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296
}
