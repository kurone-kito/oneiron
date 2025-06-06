export const clamp = (min: number, max: number, value: number): number =>
  Math.min(max, Math.max(min, value));
