// @ts-nocheck
import { h, Alert, Button, Card, ColorSwatchField, FileField, Muted } from "./ds";

function relativeLuminance(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return 1;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16) / 255);
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
function readableTextColor(hex) {
  const l = relativeLuminance(hex);
  return 1.05 / (l + 0.05) >= (l + 0.05) / 0.05 ? "#ffffff" : "#000000";
}

const PRIMARY = "#7c3aed";
const SECONDARY = "#f4f1fb";
const ACCENT = "#0ea5e9";

export function Branding() {
  return h(
    "div",
    { className: "flex flex-col gap-8 max-w-2xl" },
    h(
      "div",
      null,
      h("h1", { className: "text-2xl font-semibold text-zinc-900 dark:text-zinc-50" }, "Branding"),
      h(
        "p",
        { className: "mt-1 text-sm text-zinc-500 dark:text-zinc-400" },
        "This logo and colour scheme are used throughout your tenant's experience."
      )
    ),

    h(
      Card,
      { title: "Logo" },
      h(
        "div",
        { className: "flex items-center gap-4" },
        h(
          "div",
          {
            className:
              "flex h-20 w-20 items-center justify-center overflow-hidden rounded-md border border-dashed border-zinc-500 bg-zinc-50 dark:bg-zinc-900",
          },
          h("span", { className: "text-xs text-zinc-500 dark:text-zinc-400" }, "No logo")
        ),
        h(
          "div",
          null,
          h(FileField, { accept: "image/png,image/jpeg,image/webp,image/gif" }),
          h(Muted, { size: "xs", className: "mt-1" }, "PNG, JPEG, WebP or GIF, up to 2 MB.")
        )
      )
    ),

    h(
      Card,
      { title: "Colour scheme" },
      h(
        "div",
        { className: "flex flex-wrap gap-6" },
        h(ColorSwatchField, { label: "Primary", value: PRIMARY, onChange: () => {} }),
        h(ColorSwatchField, { label: "Secondary", value: SECONDARY, onChange: () => {} }),
        h(ColorSwatchField, { label: "Accent", value: ACCENT, onChange: () => {} })
      ),

      h(
        "div",
        {
          className: "mt-4 flex items-center gap-3 rounded-md border border-black/10 dark:border-white/10 p-4",
          style: { background: SECONDARY },
        },
        h(
          "span",
          {
            className: "rounded-full px-3 py-1.5 text-sm font-medium",
            style: { backgroundColor: PRIMARY, color: readableTextColor(PRIMARY) },
          },
          "Primary action"
        ),
        h(
          "span",
          {
            className: "rounded-full px-3 py-1.5 text-sm font-medium",
            style: { backgroundColor: ACCENT, color: readableTextColor(ACCENT) },
          },
          "Accent"
        )
      ),

      h("div", { className: "mt-4" }, h(Alert, { variant: "success", size: "sm" }, "Colour scheme saved.")),
      h(Button, { variant: "primary", className: "mt-4" }, "Save colour scheme")
    )
  );
}
