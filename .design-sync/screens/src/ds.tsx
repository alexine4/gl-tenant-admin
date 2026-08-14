// @ts-nocheck
// Thin shim over the real, already-uploaded component bundle
// (window.TenantConsoleUI) -- these screens render the product's actual
// compiled components, never lookalikes.
const G: any = (window as any).TenantConsoleUI;

export const Alert = G.Alert;
export const Badge = G.Badge;
export const Button = G.Button;
export const Card = G.Card;
export const Checkbox = G.Checkbox;
export const ColorSwatchField = G.ColorSwatchField;
export const DataTable = G.DataTable;
export const FileField = G.FileField;
export const Muted = G.Muted;
export const SelectField = G.SelectField;
export const TextField = G.TextField;

export const HBarChart = G.HBarChart;
export const HeatmapRow = G.HeatmapRow;
export const LineChart = G.LineChart;
export const SplitBar = G.SplitBar;
export const StatTile = G.StatTile;
export const TableToggle = G.TableToggle;

export const h = (window as any).React.createElement;
export const Fragment = (window as any).React.Fragment;
export const useState = (window as any).React.useState;
