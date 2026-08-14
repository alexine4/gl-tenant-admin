"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { dismissToast } from "@/store/uiSlice";

const TONE_CLASSES: Record<"success" | "error", string> = {
  success: "bg-emerald-700 text-white",
  error: "bg-red-600 text-white",
};

function ToastRow({ id, tone, message }: { id: string; tone: "success" | "error"; message: string }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const timer = setTimeout(() => dispatch(dismissToast(id)), 4000);
    return () => clearTimeout(timer);
  }, [dispatch, id]);

  return (
    <div className={`rounded-md px-3 py-2 text-sm shadow-lg ${TONE_CLASSES[tone]}`} role="status">
      {message}
    </div>
  );
}

export function ToastHost() {
  const toasts = useAppSelector((state) => state.ui.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastRow key={toast.id} {...toast} />
      ))}
    </div>
  );
}
