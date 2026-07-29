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
import { ALIGNMENTS, ORDER_OPS } from "../../../arrange";
import {
  TRANSITION_OPTIONS,
  DEFAULT_TRANSITION_US,
  toSeconds,
} from "../../../transitions";
import {
  IN_PRESETS,
  OUT_PRESETS,
  EMPHASIS_PRESETS,
  DEFAULT_IN_FRACTION,
  DEFAULT_OUT_FRACTION,
} from "../../../animations";
import {
  GRADIENT_PRESETS,
  GRADIENT_TYPES,
  MAX_GRADIENT_STOPS,
  MIN_GRADIENT_STOPS,
  gradientCss,
  parseGradientFill,
  toGradientFill,
} from "../../../gradients";

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

// A shape's fill is EITHER a solid hex string or a CSS gradient string. The
// patched engine reads both from the same `style.fill`, so switching mode is
// just a different string — no extra style key to be dropped on deserialize.
export function FillProperty({
  color,
  onColorChange,
}: {
  color: string;
  onColorChange: (color: string) => void;
}) {
  const parsed = parseGradientFill(color);
  const isGradient = Boolean(parsed);
  const current = parsed ?? {
    type: "linear",
    angle: 180,
    colors: [color || "#3b82f6", "#0000ff"],
  };

  const {
    localValue: localAngle,
    handleChange: onAngleChange,
    handleCommit: commitAngle,
  } = useSliderThrottle(current.angle, (value) =>
    onColorChange(toGradientFill({ ...current, angle: value }))
  );

  const setGradient = (next: { type: string; angle: number; colors: string[] }) =>
    onColorChange(toGradientFill(next));

  const setStop = (index: number, value: string) => {
    const colors = [...current.colors];
    colors[index] = value;
    setGradient({ ...current, colors });
  };

  return (
    <div className="flex flex-col">
      <SectionTitle title="Fill" />

      <div className="flex flex-col py-1">
        <Row label="Type">
          <Select
            value={isGradient ? "gradient" : "solid"}
            onValueChange={(mode) =>
              mode === "gradient"
                ? setGradient(current)
                : // Collapse back to the first stop so the shape keeps its look.
                  onColorChange(current.colors[0] || "#3b82f6")
            }
            options={[
              { value: "solid", label: "Solid" },
              { value: "gradient", label: "Gradient" },
            ]}
          />
        </Row>

        {!isGradient && (
          <Row label="Color">
            <ColorField color={color || "#3b82f6"} onChange={onColorChange} className="w-full" />
          </Row>
        )}

        {isGradient && (
          <>
            <div
              className="my-2 h-10 w-full rounded border border-border"
              style={{ backgroundImage: toGradientFill({ ...current, angle: localAngle }) }}
            />
            <Row label="Style">
              <Select
                value={current.type}
                onValueChange={(type) => setGradient({ ...current, type })}
                options={GRADIENT_TYPES}
              />
            </Row>
            {current.type !== "radial" && (
              <Row label="Angle">
                <Slider
                  value={localAngle}
                  min={0}
                  max={360}
                  step={1}
                  onChange={onAngleChange}
                  onCommit={commitAngle}
                />
                <span className="w-10 shrink-0 text-right font-mono text-[10px] text-muted-foreground">
                  {Math.round(localAngle)}°
                </span>
              </Row>
            )}
            {current.colors.map((stop, index) => (
              <Row
                key={index}
                label={index === 0 ? "From" : index === current.colors.length - 1 ? "To" : `Stop ${index + 1}`}
              >
                <ColorField color={stop} onChange={(value) => setStop(index, value)} />
                {current.colors.length > MIN_GRADIENT_STOPS && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 text-muted-foreground"
                    onClick={() =>
                      setGradient({
                        ...current,
                        colors: current.colors.filter((_, i) => i !== index),
                      })
                    }
                    title="Remove this stop"
                  >
                    <RiSubtractLine size={14} />
                  </Button>
                )}
              </Row>
            ))}
            {current.colors.length < MAX_GRADIENT_STOPS && (
              <Button
                variant="ghost"
                className="mt-1 h-7 w-full text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                onClick={() =>
                  setGradient({
                    ...current,
                    colors: [...current.colors, current.colors[current.colors.length - 1]],
                  })
                }
              >
                <RiAddLine size={14} className="mr-1" />
                Add stop
              </Button>
            )}
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {GRADIENT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() =>
                    setGradient({ type: "linear", angle: preset.angle, colors: [...preset.colors] })
                  }
                  title={preset.name}
                  className="h-6 w-full rounded-sm border border-border transition-transform hover:scale-105"
                  style={{
                    backgroundImage: gradientCss({
                      type: "linear",
                      angle: preset.angle,
                      colors: preset.colors,
                    }),
                    backgroundColor: preset.id === "scrim" ? "#4b5563" : undefined,
                  }}
                />
              ))}
            </div>
          </>
        )}
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

// ── Gradient (Backdrop clips) ────────────────────────────────────────────
//
// Written for Pictify. The engine's only gradient primitive is a Backdrop, so
// this section owns everything about how one looks: type, stop colours, and —
// for linear — the angle.
//
// The angle is stored inside `gradientType` as "linear:<deg>" rather than as
// its own style key, because BackdropClip rebuilds `style` from a fixed key
// list on every deserialize and would drop anything else. See src/lib/video/
// gradients.js.

interface GradientPropertyProps {
  type: string;
  angle: number;
  colors: string[];
  boundStops?: Record<number, string>;
  onChange: (next: { type: string; angle: number; colors: string[] }) => void;
}

export function GradientProperty({
  type,
  angle,
  colors,
  boundStops = {},
  onChange,
}: GradientPropertyProps) {
  const {
    localValue: localAngle,
    handleChange: onAngleChange,
    handleCommit: commitAngle,
  } = useSliderThrottle(angle, (value) => onChange({ type, angle: value, colors }));

  const setColor = (index: number, color: string) => {
    const next = [...colors];
    next[index] = color;
    onChange({ type, angle, colors: next });
  };

  const addStop = () => {
    if (colors.length >= MAX_GRADIENT_STOPS) return;
    onChange({ type, angle, colors: [...colors, colors[colors.length - 1] || "#ffffff"] });
  };

  const removeStop = (index: number) => {
    if (colors.length <= MIN_GRADIENT_STOPS) return;
    onChange({ type, angle, colors: colors.filter((_, i) => i !== index) });
  };

  return (
    <div className="border-b border-border/50 px-3 pb-3">
      <SectionTitle title="Gradient" />

      <div
        className="mb-3 h-12 w-full rounded border border-border"
        style={{ backgroundImage: gradientCss({ type, angle: localAngle, colors }) }}
      />

      <div className="space-y-1">
        <Row label="Type">
          <Select
            value={type}
            onValueChange={(value) => onChange({ type: value, angle, colors })}
            options={GRADIENT_TYPES}
          />
        </Row>

        {type !== "radial" && (
          <Row label="Angle">
            <Slider
              value={localAngle}
              min={0}
              max={360}
              step={1}
              onChange={onAngleChange}
              onCommit={commitAngle}
            />
            <span className="w-10 shrink-0 text-right font-mono text-[10px] text-muted-foreground">
              {Math.round(localAngle)}°
            </span>
          </Row>
        )}
      </div>

      <div className="mt-2 space-y-1">
        {colors.map((color, index) => {
          const bound = boundStops[index];
          return (
            <Row key={index} label={index === 0 ? "From" : index === colors.length - 1 ? "To" : `Stop ${index + 1}`}>
              {bound ? (
                // A bound stop is driven by a variable at render time, so
                // editing the colour here would be a lie.
                <span
                  className="flex-1 truncate rounded border border-primary/60 bg-accent px-2 py-1 font-mono text-[10px] text-primary"
                  title={`Set by the "${bound}" variable at render time`}
                >
                  {bound}
                </span>
              ) : (
                <ColorField color={color} onChange={(value) => setColor(index, value)} />
              )}
              {colors.length > MIN_GRADIENT_STOPS && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 text-muted-foreground"
                  onClick={() => removeStop(index)}
                  title="Remove this stop"
                >
                  <RiSubtractLine size={14} />
                </Button>
              )}
            </Row>
          );
        })}
      </div>

      {colors.length < MAX_GRADIENT_STOPS && (
        <Button
          variant="ghost"
          className="mt-1 h-7 w-full text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
          onClick={addStop}
        >
          <RiAddLine size={14} className="mr-1" />
          Add stop
        </Button>
      )}

      <div className="mt-3">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Presets
        </span>
        <div className="mt-1.5 grid grid-cols-4 gap-1.5">
          {GRADIENT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() =>
                onChange({ type: "linear", angle: preset.angle, colors: [...preset.colors] })
              }
              title={preset.name}
              className="h-6 w-full rounded-sm border border-border transition-transform hover:scale-105"
              style={{
                backgroundImage: gradientCss({
                  type: "linear",
                  angle: preset.angle,
                  colors: preset.colors,
                }),
                backgroundColor: preset.id === "scrim" ? "#4b5563" : undefined,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Text style (Pictify) ─────────────────────────────────────────────────
//
// The engine's TextStyleJSON carries stroke, shadow, lineHeight, letterSpacing,
// textCase and a text background; the vendored panel exposed none of them. The
// background is the urgent one: the "Simple Badge" text preset SETS
// style.background, after which the user had no control to edit or remove it.
//
// Every value here is a plain style key, so it round-trips through the
// serializer and renders identically on the server.

const TEXT_CASE_OPTIONS = [
  { value: "none", label: "As typed" },
  { value: "uppercase", label: "UPPERCASE" },
  { value: "lowercase", label: "lowercase" },
  { value: "title", label: "Title Case" },
];

interface TextStylePropertyProps {
  style: Record<string, any>;
  onStyleChange: (patch: Record<string, any>) => void;
}

export function TextStyleProperty({ style, onStyleChange }: TextStylePropertyProps) {
  const stroke = style.stroke || null;
  const shadow = style.shadow || null;
  const background = style.background || null;

  const { localValue: localSpacing, handleChange: onSpacing, handleCommit: commitSpacing } =
    useSliderThrottle(Number(style.letterSpacing ?? 0), (v) => onStyleChange({ letterSpacing: v }));
  const { localValue: localLine, handleChange: onLine, handleCommit: commitLine } =
    useSliderThrottle(Math.round(Number(style.lineHeight ?? 1) * 100), (v) =>
      onStyleChange({ lineHeight: v / 100 })
    );

  // Nested style objects must be written whole — the engine merges one level.
  const patchStroke = (patch: Record<string, any>) =>
    onStyleChange({ stroke: { color: "#000000", width: 2, ...(stroke || {}), ...patch } });
  const patchShadow = (patch: Record<string, any>) =>
    onStyleChange({
      shadow: { color: "#000000", alpha: 0.5, blur: 4, offsetX: 0, offsetY: 2, ...(shadow || {}), ...patch },
    });
  const patchBackground = (patch: Record<string, any>) =>
    onStyleChange({
      background: {
        color: "#000000",
        opacity: 1,
        borderRadius: 4,
        paddingX: 8,
        paddingY: 4,
        ...(background || {}),
        ...patch,
      },
    });

  return (
    <div className="flex flex-col border-b border-border/50 px-3 pb-3">
      <SectionTitle title="Text Style" />

      <div className="flex flex-col py-1">
        <Row label="Case">
          <Select
            value={style.textCase || "none"}
            onValueChange={(v) => onStyleChange({ textCase: v })}
            options={TEXT_CASE_OPTIONS}
          />
        </Row>
        <Row label="Line height">
          <Slider value={localLine} min={50} max={300} step={5} onChange={onLine} onCommit={commitLine} />
          <span className="w-10 shrink-0 text-right font-mono text-[10px] text-muted-foreground">
            {localLine}%
          </span>
        </Row>
        <Row label="Letter sp.">
          <Slider value={localSpacing} min={-10} max={40} step={1} onChange={onSpacing} onCommit={commitSpacing} />
          <span className="w-10 shrink-0 text-right font-mono text-[10px] text-muted-foreground">
            {localSpacing}
          </span>
        </Row>
      </div>

      <SectionHeader
        title="Stroke"
        hasContent={!!stroke}
        onAdd={() => patchStroke({})}
        onRemove={() => onStyleChange({ stroke: null })}
      />
      {stroke && (
        <div className="flex flex-col py-1">
          <Row label="Color">
            <ColorField color={stroke.color || "#000000"} onChange={(v) => patchStroke({ color: v })} />
          </Row>
          <Row label="Width">
            <NumberInput
              value={Number(stroke.width ?? 2)}
              onChange={(v) => patchStroke({ width: Math.max(0, v) })}
            />
          </Row>
        </div>
      )}

      <SectionHeader
        title="Shadow"
        hasContent={!!shadow}
        onAdd={() => patchShadow({})}
        onRemove={() => onStyleChange({ shadow: null })}
      />
      {shadow && (
        <div className="flex flex-col py-1">
          <Row label="Color">
            <ColorField color={shadow.color || "#000000"} onChange={(v) => patchShadow({ color: v })} />
          </Row>
          <Row label="Offset">
            <NumberInput value={Number(shadow.offsetX ?? 0)} onChange={(v) => patchShadow({ offsetX: v })} aria-label="Shadow X" />
            <NumberInput value={Number(shadow.offsetY ?? 2)} onChange={(v) => patchShadow({ offsetY: v })} aria-label="Shadow Y" />
          </Row>
          <Row label="Blur">
            <NumberInput value={Number(shadow.blur ?? 4)} onChange={(v) => patchShadow({ blur: Math.max(0, v) })} />
          </Row>
        </div>
      )}

      <SectionHeader
        title="Background"
        hasContent={!!background}
        onAdd={() => patchBackground({})}
        onRemove={() => onStyleChange({ background: null })}
      />
      {background && (
        <div className="flex flex-col py-1">
          <Row label="Color">
            <ColorField color={background.color || "#000000"} onChange={(v) => patchBackground({ color: v })} />
          </Row>
          <Row label="Radius">
            <NumberInput
              value={Number(background.borderRadius ?? 4)}
              onChange={(v) => patchBackground({ borderRadius: Math.max(0, v) })}
            />
          </Row>
          <Row label="Padding">
            <NumberInput value={Number(background.paddingX ?? 8)} onChange={(v) => patchBackground({ paddingX: Math.max(0, v) })} aria-label="Padding X" />
            <NumberInput value={Number(background.paddingY ?? 4)} onChange={(v) => patchBackground({ paddingY: Math.max(0, v) })} aria-label="Padding Y" />
          </Row>
        </div>
      )}
    </div>
  );
}

// ── Animation (Pictify) ──────────────────────────────────────────────────
//
// The engine ships 51 entrance and 51 exit presets and exposed none of them.
// It gives a clip ONE animation slot, so an In and an Out selection are
// composed into a single keyframe map (see src/lib/video/animations.js).
//
// Emphasis presets loop over the whole clip, so they are mutually exclusive
// with In/Out rather than a third dropdown you can combine.

interface AnimationPropertyProps {
  inPreset: string;
  outPreset: string;
  emphasisPreset: string;
  inFraction: number;
  outFraction: number;
  onChange: (next: {
    inPreset: string;
    outPreset: string;
    emphasisPreset: string;
    inFraction: number;
    outFraction: number;
  }) => void;
}

export function AnimationProperty({
  inPreset,
  outPreset,
  emphasisPreset,
  inFraction,
  outFraction,
  onChange,
}: AnimationPropertyProps) {
  const none = { value: "", label: "None" };
  const current = { inPreset, outPreset, emphasisPreset, inFraction, outFraction };

  const { localValue: localIn, handleChange: onIn, handleCommit: commitIn } = useSliderThrottle(
    Math.round((inFraction ?? DEFAULT_IN_FRACTION) * 100),
    (v) => onChange({ ...current, inFraction: v / 100 })
  );
  const { localValue: localOut, handleChange: onOut, handleCommit: commitOut } = useSliderThrottle(
    Math.round((outFraction ?? DEFAULT_OUT_FRACTION) * 100),
    (v) => onChange({ ...current, outFraction: v / 100 })
  );

  const emphasisOn = !!emphasisPreset;

  return (
    <div className="flex flex-col border-b border-border/50 px-3 pb-3">
      <SectionTitle title="Animate" />

      <div className="flex flex-col py-1">
        <Row label="In">
          <Select
            value={inPreset}
            onValueChange={(v) => onChange({ ...current, inPreset: v, emphasisPreset: "" })}
            options={[none, ...IN_PRESETS()]}
            disabled={emphasisOn}
          />
        </Row>
        {!!inPreset && !emphasisOn && (
          <Row label="In length">
            <Slider value={localIn} min={5} max={90} step={5} onChange={onIn} onCommit={commitIn} />
            <span className="w-10 shrink-0 text-right font-mono text-[10px] text-muted-foreground">
              {localIn}%
            </span>
          </Row>
        )}

        <Row label="Out">
          <Select
            value={outPreset}
            onValueChange={(v) => onChange({ ...current, outPreset: v, emphasisPreset: "" })}
            options={[none, ...OUT_PRESETS()]}
            disabled={emphasisOn}
          />
        </Row>
        {!!outPreset && !emphasisOn && (
          <Row label="Out length">
            <Slider value={localOut} min={5} max={90} step={5} onChange={onOut} onCommit={commitOut} />
            <span className="w-10 shrink-0 text-right font-mono text-[10px] text-muted-foreground">
              {localOut}%
            </span>
          </Row>
        )}

        <Row label="Loop">
          <Select
            value={emphasisPreset}
            onValueChange={(v) =>
              onChange({ ...current, emphasisPreset: v, inPreset: "", outPreset: "" })
            }
            options={[none, ...EMPHASIS_PRESETS()]}
          />
        </Row>
      </div>

      <p className="pt-1 text-[10px] leading-snug text-muted-foreground/80">
        {emphasisOn
          ? "A loop animation runs for the whole clip, so it replaces In and Out."
          : "In and Out share the clip: the entrance plays first, then it rests, then the exit."}
      </p>
    </div>
  );
}

// ── Transition (Pictify) ─────────────────────────────────────────────────
//
// The engine ships 68 transitions and exposed none of them. A transition is its
// own clip joining two others, so it is authored here on the INCOMING clip:
// "what plays as this clip arrives".

interface TransitionPropertyProps {
  transitionKey: string;
  durationUs: number;
  hasPrevious: boolean;
  onChange: (next: { transitionKey: string; durationUs: number }) => void;
}

export function TransitionProperty({
  transitionKey,
  durationUs,
  hasPrevious,
  onChange,
}: TransitionPropertyProps) {
  const seconds = toSeconds(durationUs || DEFAULT_TRANSITION_US);

  if (!hasPrevious) {
    return (
      <div className="flex flex-col border-b border-border/50 px-3 pb-3">
        <SectionTitle title="Transition" />
        <p className="pb-1 text-[10px] leading-snug text-muted-foreground/80">
          A transition blends this clip with the one before it. This is the first clip on its
          track, so there is nothing to blend from.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col border-b border-border/50 px-3 pb-3">
      <SectionTitle title="Transition" />
      <div className="flex flex-col py-1">
        <Row label="In">
          <Select
            value={transitionKey || ""}
            onValueChange={(v) => onChange({ transitionKey: v, durationUs })}
            options={[{ value: "", label: "None (cut)" }, ...TRANSITION_OPTIONS()]}
          />
        </Row>
        {!!transitionKey && (
          <Row label="Length">
            <NumberInput
              value={seconds}
              onChange={(v) => onChange({ transitionKey, durationUs: Math.max(0.1, v) * 1_000_000 })}
            />
            <span className="shrink-0 text-[10px] text-muted-foreground">sec</span>
          </Row>
        )}
      </div>
      <p className="pt-1 text-[10px] leading-snug text-muted-foreground/80">
        Blends from the previous clip on this track, centred on the cut.
      </p>
    </div>
  );
}

// ── Arrange (Pictify) ────────────────────────────────────────────────────
//
// Align, distribute and stacking order. Works for one clip or several — with a
// multi-selection the panel used to say "select a single clip", which is
// exactly when you most want to align things to each other.
//
// Alignment targets the artboard, so "align left" means the same thing however
// many clips are selected. Distribute needs three.

interface ArrangePropertyProps {
  count: number;
  onAlign: (id: string) => void;
  onDistribute: (axis: "x" | "y") => void;
  onOrder: (id: string) => void;
}

export function ArrangeProperty({ count, onAlign, onDistribute, onOrder }: ArrangePropertyProps) {
  const canDistribute = count >= 3;
  const btn =
    "flex h-7 flex-1 items-center justify-center rounded border border-border bg-muted/60 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-accent hover:text-foreground disabled:opacity-40 disabled:hover:bg-muted/60";

  return (
    <div className="flex flex-col border-b border-border/50 px-3 pb-3">
      <SectionTitle title="Arrange" />

      <div className="flex flex-col gap-1.5 py-1">
        <div className="flex gap-1">
          {ALIGNMENTS.filter((a) => a.axis === "x").map((a) => (
            <button key={a.id} className={btn} title={a.label} onClick={() => onAlign(a.id)}>
              <i className={`fa ${a.icon} text-[11px]`} aria-hidden="true" />
            </button>
          ))}
          <button
            className={btn}
            title={canDistribute ? "Distribute horizontally" : "Select 3 or more clips to distribute"}
            disabled={!canDistribute}
            onClick={() => onDistribute("x")}
          >
            <i className="fa fa-arrows-left-right text-[11px]" aria-hidden="true" />
          </button>
        </div>

        <div className="flex gap-1">
          {ALIGNMENTS.filter((a) => a.axis === "y").map((a) => (
            <button key={a.id} className={btn} title={a.label} onClick={() => onAlign(a.id)}>
              <i className={`fa ${a.icon} text-[11px]`} aria-hidden="true" />
            </button>
          ))}
          <button
            className={btn}
            title={canDistribute ? "Distribute vertically" : "Select 3 or more clips to distribute"}
            disabled={!canDistribute}
            onClick={() => onDistribute("y")}
          >
            <i className="fa fa-arrows-up-down text-[11px]" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-1 flex gap-1">
          {ORDER_OPS.map((o) => (
            <button key={o.id} className={btn} title={o.label} onClick={() => onOrder(o.id)}>
              <i className={`fa ${o.icon} text-[11px]`} aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
