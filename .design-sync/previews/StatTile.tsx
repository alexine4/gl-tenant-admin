import { StatTile } from "@/components/charts/StatTile";

export function Grid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <StatTile label="Visitors engaged" value={4213} />
      <StatTile label="Unanswered questions" value={182} />
      <StatTile label="Fallback rate" value={0.086} format="percent" />
      <StatTile label="Per-answer rate" value={0.014} format="currency" />
    </div>
  );
}
