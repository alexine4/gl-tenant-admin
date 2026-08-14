import { SplitBar } from "@/components/charts/SplitBar";

export function VoiceText() {
  return (
    <SplitBar
      segments={[
        { label: "Voice", value: 1240, color: "var(--viz-series-1)" },
        { label: "Text", value: 3960, color: "var(--viz-series-2)" },
      ]}
    />
  );
}

export function NewReturning() {
  return (
    <SplitBar
      segments={[
        { label: "New", value: 2680, color: "var(--viz-series-1)" },
        { label: "Returning", value: 1533, color: "var(--viz-series-2)" },
      ]}
    />
  );
}
