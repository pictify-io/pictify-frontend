/*
 * Minimal UI primitives written for Pictify to replace the upstream app's
 * shadcn/radix components consumed by the studio panels (`@/components/ui/*`:
 * input, textarea, number-input, slider, select, scroll-area, popover-based
 * color picker). Same call-site API surface where practical; the color picker
 * is a native <input type="color"> + hex field. Button and cn are re-used
 * from the vendored timeline's primitives so both islands look identical.
 */
import * as React from "react";

export { Button, cn } from "../openvideo-timeline/ui";
import { cn } from "../openvideo-timeline/ui";

// ── Input ────────────────────────────────────────────────────────────────

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-7 w-full rounded border border-border bg-muted px-2 text-xs text-foreground",
      "placeholder:text-muted-foreground focus:outline-none focus:border-primary/60",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

// ── Textarea ─────────────────────────────────────────────────────────────

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full rounded border border-border bg-muted px-2 py-1.5 text-xs text-foreground",
      "placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 resize-none",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

// ── NumberInput ──────────────────────────────────────────────────────────

interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: number;
  onChange: (val: number) => void;
}

/**
 * Commits on blur / Enter so half-typed values ("-", "1.") don't thrash the
 * engine store while editing.
 */
export function NumberInput({ value, onChange, className, ...props }: NumberInputProps) {
  const [draft, setDraft] = React.useState<string>(String(value));
  const focused = React.useRef(false);

  React.useEffect(() => {
    if (!focused.current) setDraft(String(value));
  }, [value]);

  const commit = () => {
    const parsed = parseFloat(draft);
    if (!Number.isNaN(parsed) && parsed !== value) onChange(parsed);
    else setDraft(String(value));
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={draft}
      onFocus={() => (focused.current = true)}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        focused.current = false;
        commit();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
      className={cn(
        "h-7 w-full rounded border border-border bg-muted px-2 text-xs text-foreground",
        "focus:outline-none focus:border-primary/60",
        className
      )}
      {...props}
    />
  );
}

// ── Slider ───────────────────────────────────────────────────────────────

interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (val: number) => void;
  onCommit?: (val: number) => void;
  className?: string;
}

export function Slider({ value, min = 0, max = 100, step = 1, onChange, onCommit, className }: SliderProps) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      onPointerUp={(e) => onCommit?.(parseFloat((e.target as HTMLInputElement).value))}
      className={cn("ov-slider flex-1", className)}
    />
  );
}

// ── Select (native) ──────────────────────────────────────────────────────

interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "value"> {
  value: string;
  onValueChange: (val: string) => void;
  options: Array<{ value: string; label: string }>;
}

export function Select({ value, onValueChange, options, className, ...props }: SelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      className={cn(
        "h-7 w-full rounded border border-border bg-muted px-1.5 text-xs text-foreground",
        "focus:outline-none focus:border-primary/60 cursor-pointer",
        className
      )}
      {...props}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

// ── ColorField (swatch + hex) ────────────────────────────────────────────

interface ColorFieldProps {
  color: string;
  onChange: (color: string) => void;
  className?: string;
}

const toPickerHex = (value: string) => {
  const hex = /^#([0-9a-f]{6})$/i.test(value) ? value : "#ffffff";
  return hex;
};

export function ColorField({ color, onChange, className }: ColorFieldProps) {
  return (
    <div
      className={cn(
        "flex h-7 items-center gap-1.5 rounded border border-border bg-muted px-1.5",
        className
      )}
    >
      <label
        className="relative h-4 w-4 shrink-0 cursor-pointer rounded-sm border border-border"
        style={{ backgroundColor: color || "#ffffff" }}
      >
        <input
          type="color"
          value={toPickerHex(color)}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label="Pick color"
        />
      </label>
      <input
        type="text"
        value={(color || "").toUpperCase()}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-w-0 bg-transparent font-mono text-[11px] text-foreground focus:outline-none"
        spellCheck={false}
        aria-label="Hex color"
      />
    </div>
  );
}

// ── ScrollArea ───────────────────────────────────────────────────────────

export function ScrollArea({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("overflow-y-auto ov-scroll", className)}>{children}</div>;
}
