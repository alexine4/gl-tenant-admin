"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useBrandingQuery, useSaveBrandingMutation, useUploadLogoMutation } from "@/lib/hooks/branding";
import { pickReadableTextColor } from "@/lib/contrast-color";
import { FileField } from "@/components/ui/FileField";
import { ColorSwatchField } from "@/components/ui/ColorSwatchField";
import { Alert } from "@/components/ui/Alert";
import { Muted } from "@/components/ui/Muted";
import { Button } from "@/components/ui/Button";
import { useAppDispatch } from "@/store/hooks";
import { pushToast } from "@/store/uiSlice";

const COLOR_FIELDS = [
  { key: "primary_color", label: "Primary" },
  { key: "secondary_color", label: "Secondary" },
  { key: "accent_color", label: "Accent" },
] as const;

export default function BrandingPage() {
  const dispatch = useAppDispatch();
  const { data: branding, error: loadError } = useBrandingQuery();
  const saveBranding = useSaveBrandingMutation();
  const uploadLogo = useUploadLogoMutation();

  const [colors, setColors] = useState({ primary_color: "", secondary_color: "", accent_color: "" });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Reset the colour form whenever a new `branding` object arrives (initial
  // load, or after a save/upload) -- adjusting state during render instead of
  // in an effect avoids an extra cascading render.
  const [colorsSyncedWith, setColorsSyncedWith] = useState<typeof branding>(undefined);
  if (branding && branding !== colorsSyncedWith) {
    setColorsSyncedWith(branding);
    setColors({
      primary_color: branding.primary_color,
      secondary_color: branding.secondary_color,
      accent_color: branding.accent_color,
    });
  }

  // Revoke the local object URL whenever it's replaced or the page unmounts,
  // otherwise each selected file leaks a blob URL for the tab's lifetime.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setPreviewUrl(URL.createObjectURL(file));
    uploadLogo.mutate(file, {
      onSuccess: () => dispatch(pushToast({ tone: "success", message: "Logo updated." })),
      onError: (err) =>
        dispatch(pushToast({ tone: "error", message: err instanceof Error ? err.message : "Failed to upload logo" })),
      onSettled: () => {
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
    });
  }

  function handleSaveColors() {
    saveBranding.mutate(colors, {
      onSuccess: () => dispatch(pushToast({ tone: "success", message: "Colour scheme saved." })),
      onError: (err) =>
        dispatch(
          pushToast({ tone: "error", message: err instanceof Error ? err.message : "Failed to save colour scheme" })
        ),
    });
  }

  if (loadError) {
    return <Alert variant="error">{loadError instanceof Error ? loadError.message : "Failed to load branding"}</Alert>;
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
              <span className="text-xs text-zinc-500 dark:text-zinc-400">No logo</span>
            )}
          </div>
          <div>
            <FileField
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleFileSelected}
              disabled={uploadLogo.isPending}
            />
            <Muted size="xs" className="mt-1">
              PNG, JPEG, WebP or GIF, up to 2 MB.
            </Muted>
            {uploadLogo.isPending && (
              <Muted size="xs" className="mt-1">
                Uploading…
              </Muted>
            )}
            {uploadLogo.isError && (
              <div className="mt-1">
                <Alert variant="error" size="sm">
                  {uploadLogo.error instanceof Error ? uploadLogo.error.message : "Failed to upload logo"}
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
            className="rounded-full px-3 py-1.5 text-sm font-medium"
            style={{ backgroundColor: colors.primary_color, color: pickReadableTextColor(colors.primary_color) }}
          >
            Primary action
          </span>
          <span
            className="rounded-full px-3 py-1.5 text-sm font-medium"
            style={{ backgroundColor: colors.accent_color, color: pickReadableTextColor(colors.accent_color) }}
          >
            Accent
          </span>
        </div>

        {saveBranding.isError && (
          <div className="mt-3">
            <Alert variant="error">
              {saveBranding.error instanceof Error ? saveBranding.error.message : "Failed to save colour scheme"}
            </Alert>
          </div>
        )}
        {saveBranding.isSuccess && (
          <div className="mt-3">
            <Alert variant="success">Saved.</Alert>
          </div>
        )}

        <Button onClick={handleSaveColors} disabled={saveBranding.isPending} className="mt-4">
          {saveBranding.isPending ? "Saving…" : "Save colour scheme"}
        </Button>
      </section>
    </div>
  );
}
