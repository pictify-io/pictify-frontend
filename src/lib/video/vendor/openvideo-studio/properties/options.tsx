/*
 * Vendored from openvideodev/react-video-editor —
 * src/components/editor/right-panel/properties/options/{section-header,
 * transform,opacity,text-color,fill,text-group,volume,alignment}.tsx,
 * consolidated into one module. License: OpenVideo License (free tier,
 * accepted 2026-07-27) — see LICENSE at the root of this directory.
 * Local changes: shadcn/radix primitives (Slider, InputGroup, NumberInput,
 * Popover color picker, Select, Collapsible) replaced by ../ui equivalents
 * (native range input, native select, <input type="color"> + hex field);
 * @remixicon/react replaced by ../icons; the searchable font popover reduced
 * to a native family select + style select; decoration/case rows kept.
 * The TimingProperty section is written for Pictify (start / duration in
 * seconds over timing.display microseconds).
 */
import { Button, ColorField, Input, NumberInput, Select, Slider, cn } from "../ui";
import {
  RiAddLine,
  RiAlignCenter,
  RiAlignLeft,
  RiAlignRight,
  RiSubtractLine,
} from "../icons";
import { useSliderThrottle } from "./use-slider-throttle";
import { getGroupedFonts } from "../font-utils";

const GROUPED_FONTS = getGroupedFonts();

// ── Layout helpers ───────────────────────────────────────────────────────

export function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-xs font-semibold text-foreground">{title}</span>
    </div>
  );
}

export function SectionHeader({
  title,
  hasContent,
  onAdd,
  onRemove,
}: {
  title: string;
  hasContent: boolean;
  onAdd: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-xs font-semibold text-foreground">{title}</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-muted-foreground"
        onClick={hasContent ? onRemove : onAdd}
      >
        {hasContent ? <RiSubtractLine size={16} /> : <RiAddLine size={16} />}
      </Button>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <div className="flex w-[160px] items-center gap-1.5">{children}</div>
    </div>
  );
}

// ── Transform ────────────────────────────────────────────────────────────

interface TransformPropertyProps {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  onXChange: (val: number) => void;
  onYChange: (val: number) => void;
  onWidthChange: (val: number) => void;
  onHeightChange: (val: number) => void;
  onRotationChange?: (val: number) => void;
}

export function TransformProperty({
  x,
  y,
  width,
  height,
  rotation = 0,
  onXChange,
  onYChange,
  onWidthChange,
  onHeightChange,
  onRotationChange,
}: TransformPropertyProps) {
  return (
    <div className="flex flex-col">
      <SectionTitle title="Transform" />
      <div className="flex flex-col py-1">
        <Row label="Position">
          <NumberInput value={Math.round(x)} onChange={onXChange} aria-label="X" />
          <NumberInput value={Math.round(y)} onChange={onYChange} aria-label="Y" />
        </Row>
        <Row label="Size">
          <NumberInput value={Math.round(width)} onChange={onWidthChange} aria-label="Width" />
          <NumberInput value={Math.round(height)} onChange={onHeightChange} aria-label="Height" />
        </Row>
        <Row label="Rotation">
          <NumberInput
            value={Math.round(rotation)}
            onChange={(val) => onRotationChange?.(val)}
            aria-label="Rotation"
          />
        </Row>
      </div>
    </div>
  );
}

// ── Opacity ──────────────────────────────────────────────────────────────

export function OpacityProperty({
  value,
  onChange,
}: {
  value: number;
  onChange: (val: number) => void;
}) {
  const toPercent = (v: number) => Math.round(v * 100);
  const fromPercent = (v: number) => v / 100;

  const { localValue, handleChange, handleCommit, handleDirectSet } = useSliderThrottle(
    toPercent(value),
    (pct) => onChange(fromPercent(pct)),
  );

  return (
    <div className="flex flex-col">
      <SectionTitle title="Opacity" />
      <div className="flex flex-col py-1">
        <Row label="Opacity">
          <Slider value={localValue} max={100} onChange={handleChange} onCommit={handleCommit} />
          <NumberInput
            value={localValue}
            onChange={handleDirectSet}
            className="w-12 shrink-0 text-center"
            aria-label="Opacity percent"
          />
        </Row>
      </div>
    </div>
  );
}

// ── Volume ───────────────────────────────────────────────────────────────

export function VolumeProperty({
  value,
  onChange,
}: {
  value: number;
  onChange: (val: number) => void;
}) {
  const toPercent = (v: number) => Math.round(v * 100);

  const { localValue, handleChange, handleCommit, handleDirectSet } = useSliderThrottle(
    toPercent(value),
    (pct) => onChange(pct / 100),
  );

  return (
    <div className="flex flex-col">
      <SectionTitle title="Audio" />
      <div className="flex flex-col py-1">
        <Row label="Volume">
          <Slider value={localValue} max={100} onChange={handleChange} onCommit={handleCommit} />
          <NumberInput
            value={localValue}
            onChange={handleDirectSet}
            className="w-12 shrink-0 text-center"
            aria-label="Volume percent"
          />
        </Row>
      </div>
    </div>
  );
}

// ── Text color ───────────────────────────────────────────────────────────

export function TextColorProperty({
  color,
  onColorChange,
}: {
  color: string;
  onColorChange: (color: string) => void;
}) {
  return (
    <div className="flex flex-col">
      <SectionTitle title="Text Color" />
      <div className="flex flex-col py-1">
        <Row label="Color">
          <ColorField color={color || "#ffffff"} onChange={onColorChange} className="w-full" />
        </Row>
      </div>
    </div>
  );
}

// ── Fill (shapes) ────────────────────────────────────────────────────────

export function FillProperty({
  color,
  onColorChange,
}: {
  color: string;
  onColorChange: (color: string) => void;
}) {
  return (
    <div className="flex flex-col">
      <SectionTitle title="Fill" />
      <div className="flex flex-col py-1">
        <Row label="Color">
          <ColorField color={color || "#3b82f6"} onChange={onColorChange} className="w-full" />
        </Row>
      </div>
    </div>
  );
}

// ── Typography group ─────────────────────────────────────────────────────

interface TextGroupPropertyProps {
  text: string;
  onTextChange: (val: string) => void;
  currentFamily: string;
  currentPostScriptName: string;
  fontSize: number;
  onFontChange: (postScriptName: string) => void;
  onFontStyleChange: (postScriptName: string) => void;
  onFontSizeChange: (val: number) => void;
  textAlign: "left" | "center" | "right";
  onTextAlignChange: (val: "left" | "center" | "right") => void;
}

export function TextGroupProperty({
  text,
  onTextChange,
  currentFamily,
  currentPostScriptName,
  fontSize,
  onFontChange,
  onFontStyleChange,
  onFontSizeChange,
  textAlign,
  onTextAlignChange,
}: TextGroupPropertyProps) {
  const familyData = GROUPED_FONTS.find((f) => f.family === currentFamily);
  const fontStyles = familyData?.styles || [];

  const familyOptions = GROUPED_FONTS.map((f) => ({ value: f.family, label: f.family })).sort(
    (a, b) => a.label.localeCompare(b.label),
  );
  // The current family may come from a preset outside the vendored subset —
  // keep it selectable so the select does not silently jump.
  if (!familyData) familyOptions.unshift({ value: currentFamily, label: currentFamily });

  const styleOptions = fontStyles.map((style) => ({
    value: style.postScriptName,
    label: style.fullName.replace(currentFamily, "").trim() || "Regular",
  }));
  if (!styleOptions.some((option) => option.value === currentPostScriptName)) {
    styleOptions.unshift({ value: currentPostScriptName, label: "Custom" });
  }

  return (
    <div className="flex flex-col">
      <SectionTitle title="Typography" />
      <div className="flex flex-col py-1">
        <Row label="Content">
          <Input value={text} onChange={(e) => onTextChange(e.target.value)} placeholder="Text" />
        </Row>
        <Row label="Font">
          <Select
            value={familyData ? currentFamily : currentFamily}
            onValueChange={(family) => {
              const target = GROUPED_FONTS.find((f) => f.family === family);
              if (target) onFontChange(target.mainFont.postScriptName);
            }}
            options={familyOptions}
            aria-label="Font family"
          />
        </Row>
        {styleOptions.length > 1 && (
          <Row label="Style">
            <Select
              value={currentPostScriptName}
              onValueChange={onFontStyleChange}
              options={styleOptions}
              aria-label="Font style"
            />
          </Row>
        )}
        <Row label="Size">
          <NumberInput value={fontSize} onChange={onFontSizeChange} aria-label="Font size" />
        </Row>
        <Row label="Align">
          <div className="flex w-full items-center rounded border border-border bg-muted p-0.5">
            {[
              { icon: RiAlignLeft, value: "left" as const },
              { icon: RiAlignCenter, value: "center" as const },
              { icon: RiAlignRight, value: "right" as const },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => onTextAlignChange(item.value)}
                className={cn(
                  "flex h-6 flex-1 items-center justify-center rounded-sm transition-colors",
                  textAlign === item.value
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-label={`Align ${item.value}`}
              >
                <item.icon size={14} />
              </button>
            ))}
          </div>
        </Row>
      </div>
    </div>
  );
}

// ── Timing (written for Pictify) ─────────────────────────────────────────

const US = 1_000_000;

export function TimingProperty({
  from,
  to,
  onFromChange,
  onDurationChange,
}: {
  from: number; // microseconds
  to: number; // microseconds
  onFromChange: (fromUs: number) => void;
  onDurationChange: (durationUs: number) => void;
}) {
  const startSec = from / US;
  const durationSec = Math.max(0, to - from) / US;

  return (
    <div className="flex flex-col">
      <SectionTitle title="Timing" />
      <div className="flex flex-col py-1">
        <Row label="Start (s)">
          <NumberInput
            value={Math.round(startSec * 100) / 100}
            onChange={(val) => onFromChange(Math.max(0, val) * US)}
            aria-label="Start seconds"
          />
        </Row>
        <Row label="Duration (s)">
          <NumberInput
            value={Math.round(durationSec * 100) / 100}
            onChange={(val) => onDurationChange(Math.max(0.1, val) * US)}
            aria-label="Duration seconds"
          />
        </Row>
      </div>
    </div>
  );
}
