export function clampRating(rating: number): number {
  if (!Number.isFinite(rating)) return 0
  return Math.min(5, Math.max(0, Math.round(rating)))
}
