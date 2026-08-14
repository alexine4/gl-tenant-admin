const HEX_RE = /^#?([0-9a-f]{6})$/i;

function relativeLuminance(hex: string): number | null {
  const match = HEX_RE.exec(hex.trim());
  if (!match) return null;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(match[1].slice(i, i + 2), 16) / 255);
  const linear = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/**
 * Picks black or white text -- whichever contrasts more with an arbitrary
 * (e.g. tenant-chosen) background colour. Comparing both candidates against
 * the WCAG relative-luminance formula guarantees at least ~4.6:1 contrast
 * for any input, unlike a fixed `text-white` that fails on light picks.
 */
export function pickReadableTextColor(backgroundHex: string): "#ffffff" | "#000000" {
  const luminance = relativeLuminance(backgroundHex);
  if (luminance === null) return "#ffffff";
  const contrastWithWhite = 1.05 / (luminance + 0.05);
  const contrastWithBlack = (luminance + 0.05) / 0.05;
  return contrastWithWhite >= contrastWithBlack ? "#ffffff" : "#000000";
}
