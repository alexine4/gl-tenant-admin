"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useAuth } from "@/lib/auth-client";
import { readJsonOrThrow, type TenantBranding } from "@/lib/branding-client";

const COLOR_FIELDS = [
  { key: "primary_color", label: "Primary" },
  { key: "secondary_color", label: "Secondary" },
  { key: "accent_color", label: "Accent" },
] as const;

export default function BrandingPage() {
  const { authFetch } = useAuth();
  const [branding, setBranding] = useState<TenantBranding | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [colors, setColors] = useState({ primary_color: "", secondary_color: "", accent_color: "" });
  const [savingColors, setSavingColors] = useState(false);
  const [colorsSaved, setColorsSaved] = useState(false);
  const [colorsError, setColorsError] = useState<string | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await authFetch("/tenant/branding");
        const data = (await readJsonOrThrow(res)) as TenantBranding;
        if (cancelled) return;
        setBranding(data);
        setColors({
          primary_color: data.primary_color,
          secondary_color: data.secondary_color,
          accent_color: data.accent_color,
        });
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Failed to load branding");
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [authFetch]);

  // Revoke the local object URL whenever it's replaced or the page unmounts,
  // otherwise each selected file leaks a blob URL for the tab's lifetime.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);
      const res = await authFetch("/tenant/branding/logo", { method: "POST", body: formData });
      const updated = (await readJsonOrThrow(res)) as TenantBranding;
      setBranding(updated);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to upload logo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSaveColors() {
    setColorsError(null);
    setColorsSaved(false);
    setSavingColors(true);
    try {
      const res = await authFetch("/tenant/branding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(colors),
      });
      const updated = (await readJsonOrThrow(res)) as TenantBranding;
      setBranding(updated);
      setColorsSaved(true);
    } catch (err) {
      setColorsError(err instanceof Error ? err.message : "Failed to save colour scheme");
    } finally {
      setSavingColors(false);
    }
  }

  if (loadError) {
    return (
      <p className="rounded-md bg-red-50 dark:bg-red-950 px-3 py-2 text-sm text-red-700 dark:text-red-300">
        {loadError}
      </p>
    );
  }

  if (!branding) {
    return <p className="text-sm text-zinc-500">Loading…</p>;
  }

  const displayedLogo = previewUrl ?? branding.logo_url;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Branding</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        This logo and colour scheme are used throughout your tenant&apos;s experience.
      </p>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Logo</h2>
        <div className="mt-3 flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-md border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900">
            {displayedLogo ? (
              // eslint-disable-next-line @next/next/no-img-element -- tenant-uploaded, not a build-time-known asset
              <img src={displayedLogo} alt="Tenant logo" className="h-full w-full object-contain" />
            ) : (
              <span className="text-xs text-zinc-400">No logo</span>
            )}
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleFileSelected}
              disabled={uploading}
              className="block text-sm text-zinc-700 dark:text-zinc-300"
            />
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">PNG, JPEG, WebP or GIF, up to 2 MB.</p>
            {uploading && <p className="mt-1 text-xs text-zinc-500">Uploading…</p>}
            {uploadError && (
              <p className="mt-1 rounded-md bg-red-50 dark:bg-red-950 px-2 py-1 text-xs text-red-700 dark:text-red-300">
                {uploadError}
              </p>
            )}
          </div>
        </div>
      </section>

      <hr className="my-8 border-black/10 dark:border-white/10" />

      <section>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Colour scheme</h2>
        <div className="mt-3 flex flex-wrap gap-6">
          {COLOR_FIELDS.map(({ key, label }) => (
            <label key={key} className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {label}
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={colors[key]}
                  onChange={(e) => setColors((c) => ({ ...c, [key]: e.target.value }))}
                  className="h-9 w-9 cursor-pointer rounded border border-zinc-300 dark:border-zinc-700 bg-transparent p-0"
                />
                <input
                  type="text"
                  value={colors[key]}
                  onChange={(e) => setColors((c) => ({ ...c, [key]: e.target.value }))}
                  className="w-24 rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 py-1 text-xs font-mono outline-none focus:border-zinc-500"
                />
              </div>
            </label>
          ))}
        </div>

        <div
          className="mt-4 flex items-center gap-3 rounded-md border border-black/10 dark:border-white/10 p-4"
          style={{ background: colors.secondary_color }}
        >
          <span
            className="rounded-full px-3 py-1.5 text-sm font-medium text-white"
            style={{ backgroundColor: colors.primary_color }}
          >
            Primary action
          </span>
          <span
            className="rounded-full px-3 py-1.5 text-sm font-medium text-white"
            style={{ backgroundColor: colors.accent_color }}
          >
            Accent
          </span>
        </div>

        {colorsError && (
          <p className="mt-3 rounded-md bg-red-50 dark:bg-red-950 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {colorsError}
          </p>
        )}
        {colorsSaved && <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">Saved.</p>}

        <button
          onClick={handleSaveColors}
          disabled={savingColors}
          className="mt-4 rounded-full bg-zinc-900 dark:bg-zinc-50 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:opacity-90 disabled:opacity-50"
        >
          {savingColors ? "Saving…" : "Save colour scheme"}
        </button>
      </section>
    </div>
  );
}
