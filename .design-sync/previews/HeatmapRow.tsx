import { HeatmapRow } from "@/components/charts/HeatmapRow";

const HOURLY = [2, 1, 0, 0, 0, 1, 4, 12, 28, 41, 52, 58, 61, 55, 48, 44, 39, 35, 30, 22, 15, 9, 5, 3];

export function ConversationsByHour() {
  return <HeatmapRow data={HOURLY} labelFor={(i) => `${i}:00`} />;
}
