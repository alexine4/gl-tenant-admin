"use client";

import { useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";

export type TableColumn<T> = DataTableColumn<T>;

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
      <Button variant="link" size="sm" className="mt-2" onClick={() => setShow((v) => !v)}>
        {show ? "Hide" : "View"} as table
      </Button>
      {show && (
        <div className="mt-2 max-h-48 overflow-auto">
          <DataTable rows={rows} columns={columns} rowKey={rowKey} density="compact" />
        </div>
      )}
    </div>
  );
}
