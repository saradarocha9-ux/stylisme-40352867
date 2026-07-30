/** Feedback tátil sutil (quando suportado). */
export function tap(pattern: number | number[] = 8) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern);
  } catch {
    /* ignore */
  }
}

export function celebrate() {
  tap([10, 40, 18]);
}
