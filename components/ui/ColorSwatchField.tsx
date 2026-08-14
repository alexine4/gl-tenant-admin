import { fieldLabelClasses, textFieldClasses } from "@/components/ui/TextField";

export function ColorSwatchField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className={fieldLabelClasses}>
      {label}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-9 cursor-pointer rounded border border-zinc-500 bg-transparent p-0"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-24 font-mono ${textFieldClasses("sm")}`}
        />
      </div>
    </label>
  );
}
