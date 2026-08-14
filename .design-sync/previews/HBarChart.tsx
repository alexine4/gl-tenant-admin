import { HBarChart } from "@/components/charts/HBarChart";

export function AnsweredByLayer() {
  return (
    <HBarChart
      data={[
        { label: "KnowledgeBase", value: 412, color: "var(--viz-series-1)" },
        { label: "FAQ", value: 268, color: "var(--viz-series-2)" },
        { label: "LLM", value: 154, color: "var(--viz-series-3)" },
        { label: "Fallback", value: 61, color: "var(--viz-series-4)" },
      ]}
    />
  );
}

export function ConversionFunnel() {
  return (
    <HBarChart
      data={[
        { label: "Visited", value: 5200, color: "var(--viz-seq-250)" },
        { label: "Engaged", value: 3100, color: "var(--viz-seq-350)" },
        { label: "Asked a question", value: 1800, color: "var(--viz-seq-450)" },
        { label: "Got an answer", value: 1450, color: "var(--viz-seq-550)" },
        { label: "Converted", value: 320, color: "var(--viz-seq-650)" },
      ]}
    />
  );
}
