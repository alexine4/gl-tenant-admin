import type { ReactNode } from "react";

export interface DataTableColumn<T> {
  header: string;
  cell: (row: T) => ReactNode;
  /** Extra classes for this column's <td> (e.g. a specific text tone or tabular-nums). */
  className?: string;
}

export interface DataTableProps<T> {
  rows: T[];
  columns: DataTableColumn<T>[];
  rowKey: (row: T, index: number) => string;
  /** Row background on hover. Only meaningful at "comfortable" density. */
  hoverable?: boolean;
  /** "compact" is the dense variant used by collapsible "view as table" sections. */
  density?: "comfortable" | "compact";
}

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  hoverable = true,
  density = "comfortable",
}: DataTableProps<T>) {
  const compact = density === "compact";

  return (
    <table className={`w-full border-collapse ${compact ? "text-xs" : "text-sm"}`}>
      <thead>
        <tr
          className={
            compact
              ? "text-left text-zinc-500"
              : "border-b border-black/10 dark:border-white/10 text-left text-zinc-500 dark:text-zinc-400"
          }
        >
          {columns.map((c) => (
            <th key={c.header} className={compact ? "py-1 pr-4" : "py-2 pr-4 font-medium"}>
              {c.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr
            key={rowKey(row, i)}
            className={`${compact ? "border-t" : "border-b"} border-black/5 dark:border-white/5 ${
              !compact && hoverable ? "hover:bg-zinc-100 dark:hover:bg-zinc-900" : ""
            }`}
          >
            {columns.map((c) => (
              <td key={c.header} className={`${compact ? "py-1 pr-4 tabular-nums" : "py-2 pr-4"} ${c.className ?? ""}`}>
                {c.cell(row)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
