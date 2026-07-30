/*
 * Written for Pictify (not part of the upstream app).
 *
 * A visual picker for transitions and animations.
 *
 * Both used to be a native <select>: 68 transitions and 52 animations in flat
 * text lists, with names like "Butterfly Wave Scrawler" and "Polka Dots
 * Curtain". You cannot tell what any of those do without applying one and
 * scrubbing the timeline, so choosing meant guessing, applying, undoing, and
 * guessing again. The catalog was already grouped into nine categories and the
 * flat list threw that away.
 *
 * Each tile animates the shape of its motion on hover or focus. Approximate on
 * purpose — see motion-preview.js for why the real blend is the wrong thing to
 * render here.
 *
 * ── The popover is portaled, and has to be ────────────────────────────────
 *
 * The properties panel is `overflow-y-auto`. An absolutely-positioned popover
 * inside it gets clipped at the panel edge, which for a control near the bottom
 * of a long panel means the picker opens mostly invisible. It renders into
 * document.body at fixed coordinates instead, and flips above the trigger when
 * there is no room below.
 */
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "../ui";
import { RiSearchLine, RiCloseLine } from "../icons";
import {
  previewSpec,
  groupByCategory,
  filterMotions,
} from "../../../motion-preview";

export interface MotionOption {
  value: string;
  label: string;
  category?: string;
}

interface MotionPickerProps {
  value: string;
  options: MotionOption[];
  onChange: (value: string) => void;
  /** Label for the empty choice. Transitions call it "None (cut)". */
  noneLabel?: string;
  /** Accessible name for the trigger, e.g. "Transition in". */
  ariaLabel: string;
  /** A loop animation owns the whole clip, so it disables In and Out. */
  disabled?: boolean;
}

const POPOVER_WIDTH = 320;
const POPOVER_MAX_HEIGHT = 380;
const GUTTER = 8;

/* ── The preview tile ──────────────────────────────────────────────────── */

/*
 * Two stacked fields — the outgoing clip and the incoming one — with the
 * incoming field's reveal driven by the family. Rendering both is what makes a
 * transition legible: a single moving square shows direction but not that one
 * thing is replacing another.
 */
function MotionPreview({
  option,
  playing,
  compact,
}: {
  option: MotionOption;
  playing: boolean;
  compact?: boolean;
}) {
  const spec = useMemo(() => previewSpec(option), [option]);
  const cls = cn(
    "ovm-preview",
    compact && "ovm-trigger-preview",
    `ovm-${spec.family}`,
    spec.direction && `ovm-dir-${spec.direction}`,
    spec.reverse && "ovm-reverse",
    playing && "ovm-playing",
  );
  return (
    <span className={cls} aria-hidden="true">
      <span className="ovm-from" />
      <span className="ovm-to" />
    </span>
  );
}

/* ── The picker ────────────────────────────────────────────────────────── */

export function MotionPicker({
  value,
  options,
  onChange,
  noneLabel = "None",
  ariaLabel,
  disabled = false,
}: MotionPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hovered, setHovered] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [position, setPosition] = useState({ top: -9999, left: -9999 });

  const selected = options.find((o) => o.value === value) || null;
  const filtered = useMemo(() => filterMotions(options, query), [options, query]);
  const groups = useMemo(() => groupByCategory(filtered), [filtered]);

  /*
   * Compute the FINAL top-left, rather than positioning below the trigger and
   * correcting with a translateY(-100%). The transform approach cannot be
   * clamped — the pre-transform coordinate is what gets set, so a trigger near
   * the viewport edge still put the popover off-screen — and it also fought the
   * open animation, which wants translateY of its own.
   */
  const place = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    // Real height once rendered; the cap is only the first-paint estimate.
    const height = Math.min(popoverRef.current?.offsetHeight || POPOVER_MAX_HEIGHT, POPOVER_MAX_HEIGHT);
    const viewportH = window.innerHeight;

    const below = rect.bottom + GUTTER;
    const above = rect.top - GUTTER - height;
    // Prefer below; go above only when below would overflow AND above fits.
    const top = below + height > viewportH - GUTTER && above >= GUTTER ? above : below;

    setPosition({
      // Clamped last, so a trigger scrolled out of view still leaves the
      // popover somewhere a user can actually see and dismiss it.
      top: Math.max(GUTTER, Math.min(top, viewportH - height - GUTTER)),
      // Right-aligned to the trigger, then clamped to the viewport.
      left: Math.max(
        GUTTER,
        Math.min(rect.right - POPOVER_WIDTH, window.innerWidth - POPOVER_WIDTH - GUTTER),
      ),
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    // The panel scrolls and the window resizes; a popover pinned to stale
    // coordinates detaches from its trigger and looks like a stray dialog.
    // Capture phase catches scrolls on any ancestor, not just the window.
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, place]);

  useEffect(() => {
    if (disabled && open) setOpen(false);
  }, [disabled, open]);

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (popoverRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  const choose = (next: string) => {
    onChange(next);
    setOpen(false);
    setQuery("");
    triggerRef.current?.focus();
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-7 w-full items-center gap-2 rounded border border-border bg-muted/60 px-1.5 text-left",
          "transition-colors hover:border-primary/50 hover:bg-accent",
          "focus:outline-none focus-visible:ring-1 focus-visible:ring-primary",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border disabled:hover:bg-muted/60",
          open && "border-primary/60",
        )}
      >
        {selected ? (
          <MotionPreview option={selected} playing={false} compact />
        ) : (
          <span className="ovm-preview ovm-trigger-preview ovm-none" aria-hidden="true" />
        )}
        <span className="min-w-0 flex-1 truncate text-xs text-foreground">
          {selected ? selected.label : noneLabel}
        </span>
      </button>

      {open &&
        createPortal(
          <div
            ref={popoverRef}
            role="dialog"
            aria-label={ariaLabel}
            className="ovm-popover"
            style={{
              top: position.top,
              left: position.left,
              width: POPOVER_WIDTH,
              maxHeight: POPOVER_MAX_HEIGHT,
            }}
          >
            <div className="flex items-center gap-1.5 border-b border-border px-2 py-1.5">
              <RiSearchLine size={12} className="shrink-0 text-muted-foreground" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${options.length} options`}
                className="min-w-0 flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <RiCloseLine size={12} />
                </button>
              )}
            </div>

            <div className="ovm-scroll overflow-y-auto p-2" style={{ maxHeight: POPOVER_MAX_HEIGHT - 38 }}>
              {/* The empty choice is a tile too, so "remove this transition" is
                  the same gesture as picking one rather than a separate control. */}
              <button
                type="button"
                onClick={() => choose("")}
                className={cn("ovm-tile", !value && "ovm-tile-selected")}
              >
                <span className="ovm-preview ovm-trigger-preview ovm-none" aria-hidden="true" />
                <span className="ovm-tile-label">{noneLabel}</span>
              </button>

              {groups.length === 0 && (
                <p className="px-1 py-6 text-center text-xs text-muted-foreground">
                  Nothing matches “{query}”.
                </p>
              )}

              {groups.map((group) => (
                <section key={group.category} className="pt-3">
                  <h4 className="px-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </h4>
                  <div className="grid grid-cols-3 gap-1.5">
                    {group.options.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => choose(option.value)}
                        onMouseEnter={() => setHovered(option.value)}
                        onMouseLeave={() => setHovered(null)}
                        onFocus={() => setHovered(option.value)}
                        onBlur={() => setHovered(null)}
                        title={option.label}
                        className={cn("ovm-tile", value === option.value && "ovm-tile-selected")}
                      >
                        <MotionPreview option={option} playing={hovered === option.value} />
                        <span className="ovm-tile-label">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
