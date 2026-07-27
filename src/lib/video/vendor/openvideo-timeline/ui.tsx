/*
 * Minimal UI primitives written for Pictify to replace the upstream app's
 * shadcn/radix `@/components/ui/button`, `@/components/ui/dropdown-menu` and
 * the `cn` helper from `@/lib/utils` (not vendored — they pull in Radix,
 * class-variance-authority and tailwind-merge, which this repo does not use).
 * Same component API surface as consumed by the vendored timeline files.
 */
import * as React from "react";

/** Join class names; good enough for the vendored call sites (no tw-merge). */
export function cn(...inputs: Array<string | false | null | undefined>): string {
  return inputs.filter(Boolean).join(" ");
}

// ── Button ───────────────────────────────────────────────────────────────

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "ghost" | "default";
  size?: "icon" | "default";
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
        "disabled:pointer-events-none disabled:opacity-40",
        variant === "ghost"
          ? "text-foreground/80 hover:bg-accent hover:text-accent-foreground"
          : "bg-primary text-primary-foreground hover:bg-primary/90",
        size === "icon" ? "h-8 w-8" : "h-8 px-2",
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";

// ── Dropdown menu (context-based, no portal) ─────────────────────────────

const DropdownContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
} | null>(null);

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div ref={rootRef} className="relative inline-flex">
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

export function DropdownMenuTrigger({
  asChild,
  children,
}: {
  asChild?: boolean;
  children: React.ReactElement;
}) {
  const ctx = React.useContext(DropdownContext);
  if (!ctx) return children;
  const toggle = (event: React.MouseEvent) => {
    event.preventDefault();
    ctx.setOpen(!ctx.open);
  };
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: toggle,
      style: { cursor: "pointer", ...((children.props as any).style || {}) },
    });
  }
  return (
    <button type="button" onClick={toggle}>
      {children}
    </button>
  );
}

export function DropdownMenuContent({
  children,
  className,
  align = "start",
}: {
  children: React.ReactNode;
  className?: string;
  align?: "start" | "end";
}) {
  const ctx = React.useContext(DropdownContext);
  if (!ctx || !ctx.open) return null;
  return (
    <div
      className={cn(
        "absolute top-full mt-1 z-[10000] rounded-lg p-1 shadow-lg",
        align === "end" ? "right-0" : "left-0",
        className
      )}
      role="menu"
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({
  children,
  className,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const ctx = React.useContext(DropdownContext);
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        onClick?.();
        ctx?.setOpen(false);
      }}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 text-left select-none",
        disabled ? "pointer-events-none opacity-50" : "hover:bg-accent hover:text-accent-foreground",
        className
      )}
    >
      {children}
    </button>
  );
}

export function DropdownMenuShortcut({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={cn("ml-auto tracking-widest", className)}>{children}</span>;
}

export function DropdownMenuGroup({ children }: { children: React.ReactNode }) {
  return <div role="group">{children}</div>;
}
