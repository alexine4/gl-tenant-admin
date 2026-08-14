import { FileField } from "@/components/ui/FileField";
import { Muted } from "@/components/ui/Muted";

export function LogoUpload() {
  return (
    <div>
      <FileField accept="image/png,image/jpeg,image/webp,image/gif" />
      <Muted size="xs" className="mt-1">
        PNG, JPEG, WebP or GIF, up to 2 MB.
      </Muted>
    </div>
  );
}

export function MultipleFiles() {
  return (
    <div>
      <FileField multiple />
      <Muted size="xs" className="mt-1">
        TXT, Markdown, CSV, HTML, JSON, PDF, DOCX (up to 20 MB each).
      </Muted>
    </div>
  );
}
