import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface Toast {
  id: string;
  tone: "success" | "error";
  message: string;
}

interface AnalyticsRange {
  from: string;
  to: string;
}

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

interface UiState {
  sidebarOpen: boolean;
  analyticsRange: AnalyticsRange;
  toasts: Toast[];
}

const initialState: UiState = {
  sidebarOpen: false,
  analyticsRange: { from: isoDaysAgo(29), to: isoDaysAgo(0) },
  toasts: [],
};

let toastCounter = 0;

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    closeSidebar(state) {
      state.sidebarOpen = false;
    },
    setAnalyticsRange(state, action: PayloadAction<AnalyticsRange>) {
      state.analyticsRange = action.payload;
    },
    pushToast(state, action: PayloadAction<{ tone: Toast["tone"]; message: string }>) {
      toastCounter += 1;
      state.toasts.push({ id: `toast-${toastCounter}`, ...action.payload });
    },
    dismissToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

export const { toggleSidebar, closeSidebar, setAnalyticsRange, pushToast, dismissToast } = uiSlice.actions;
export default uiSlice.reducer;
