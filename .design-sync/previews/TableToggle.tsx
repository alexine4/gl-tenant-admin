import { TableToggle } from "@/components/charts/TableToggle";

interface PeriodRow {
  date: string;
  conversations: number;
  questions: number;
}

const ROWS: PeriodRow[] = [
  { date: "2026-07-12", conversations: 190, questions: 140 },
  { date: "2026-07-13", conversations: 230, questions: 175 },
  { date: "2026-07-14", conversations: 210, questions: 168 },
];

export function Collapsed() {
  return (
    <TableToggle
      rows={ROWS}
      rowKey={(r) => r.date}
      columns={[
        { header: "Date", cell: (r) => r.date },
        { header: "Conversations", cell: (r) => r.conversations },
        { header: "Questions", cell: (r) => r.questions },
      ]}
    />
  );
}
