"use client";

import { useState, type ReactNode } from "react";

export interface TableColumn<T> {
  header: string;
  cell: (row: T) => ReactNode;
}

/**
 * Every chart needs a WCAG-clean twin: a plain table holding the same
 * values a hover-only chart (line, heatmap) would otherwise gate.
 */
export function TableToggle<T>({ rows, columns, rowKey }: {
  rows: T[];
  columns: TableColumn<T>[];
  rowKey: (row: T, index: number) => string;
}) {
  const [show, setShow] = useState(false);

  return (
    <div>
      <button onClick={() => setShow((v) => !v)} className="mt-2 text-xs text-zinc-500 hover:underline">
        {show ? "Hide" : "View"} as table
      </button>
      {show && (
        <div className="mt-2 max-h-48 overflow-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="text-left text-zinc-500">
                {columns.map((c) => (
                  <th key={c.header} className="py-1 pr-4">
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={rowKey(row, i)} className="border-t border-black/5 dark:border-white/5">
                  {columns.map((c) => (
                    <td key={c.header} className="py-1 pr-4 tabular-nums">
                      {c.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
