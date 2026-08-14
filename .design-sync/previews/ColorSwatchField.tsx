import { useState } from "react";
import { ColorSwatchField } from "@/components/ui/ColorSwatchField";

export function BrandColors() {
  const [primary, setPrimary] = useState("#4F46E5");
  const [accent, setAccent] = useState("#22C55E");
  return (
    <div className="flex flex-wrap gap-6">
      <ColorSwatchField label="Primary" value={primary} onChange={setPrimary} />
      <ColorSwatchField label="Accent" value={accent} onChange={setAccent} />
    </div>
  );
}
