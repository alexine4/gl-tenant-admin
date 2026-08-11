"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useAuth } from "@/lib/auth-client";
import { readJsonOrThrow, type TenantBranding } from "@/lib/branding-client";
import { FileField } from "@/components/ui/FileField";
import { ColorSwatchField } from "@/components/ui/ColorSwatchField";
import { Alert } from "@/components/ui/Alert";
import { Muted } from "@/components/ui/Muted";
import { Button } from "@/components/ui/Button";

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
    return <Alert variant="error">{loadError}</Alert>;
  }

  if (!branding) {
    return <Muted>Loading…</Muted>;
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
            <FileField
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleFileSelected}
              disabled={uploading}
            />
            <Muted size="xs" className="mt-1">
              PNG, JPEG, WebP or GIF, up to 2 MB.
            </Muted>
            {uploading && (
              <Muted size="xs" className="mt-1">
                Uploading…
              </Muted>
            )}
            {uploadError && (
              <div className="mt-1">
                <Alert variant="error" size="sm">
                  {uploadError}
                </Alert>
              </div>
            )}
          </div>
        </div>
      </section>

      <hr className="my-8 border-black/10 dark:border-white/10" />

      <section>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Colour scheme</h2>
        <div className="mt-3 flex flex-wrap gap-6">
          {COLOR_FIELDS.map(({ key, label }) => (
            <ColorSwatchField
              key={key}
              label={label}
              value={colors[key]}
              onChange={(value) => setColors((c) => ({ ...c, [key]: value }))}
            />
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
          <div className="mt-3">
            <Alert variant="error">{colorsError}</Alert>
          </div>
        )}
        {colorsSaved && (
          <div className="mt-3">
            <Alert variant="success">Saved.</Alert>
          </div>
        )}

        <Button onClick={handleSaveColors} disabled={savingColors} className="mt-4">
          {savingColors ? "Saving…" : "Save colour scheme"}
        </Button>
      </section>
    </div>
  );
}
