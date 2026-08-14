import { LineChart } from "@/components/charts/LineChart";

const DAYS = ["07-08", "07-09", "07-10", "07-11", "07-12", "07-13", "07-14"];

export function TwoSeries() {
  return (
    <LineChart
      categories={DAYS}
      series={[
        { label: "Conversations", color: "var(--viz-series-1)", values: [120, 132, 101, 134, 190, 230, 210] },
        { label: "Questions", color: "var(--viz-series-2)", values: [80, 95, 70, 88, 140, 175, 168] },
      ]}
    />
  );
}

export function SingleSeries() {
  return (
    <LineChart
      categories={DAYS}
      series={[{ label: "Drop-off rate", color: "var(--viz-series-1)", values: [12.4, 11.8, 13.1, 10.9, 9.6, 8.8, 9.2] }]}
    />
  );
}
