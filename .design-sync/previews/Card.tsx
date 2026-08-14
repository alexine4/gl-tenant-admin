import { Card } from "@/components/ui/Card";
import { HBarChart } from "@/components/charts/HBarChart";

export function Titled() {
  return (
    <Card title="Which layer answered">
      <HBarChart
        data={[
          { label: "KnowledgeBase", value: 412, color: "#2a78d6" },
          { label: "FAQ", value: 268, color: "#eb6834" },
          { label: "LLM", value: 154, color: "#1baf7a" },
          { label: "Fallback", value: 61, color: "#eda100" },
        ]}
      />
    </Card>
  );
}

export function Untitled() {
  return <Card>Plain content, no heading — used when the surrounding page already names the section.</Card>;
}
