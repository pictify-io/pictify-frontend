/*
 * Stock library tab (written for Pictify; upstream splits this across
 * src/components/editor/media-panel/panel/{images,videos}.tsx).
 *
 * The media panel only ever showed what the user had already uploaded, which
 * makes the first five minutes in the editor a hunt for a file. This searches a
 * stock provider instead, through a server proxy that holds the API key.
 *
 * ── Not configured is a state, not an error ───────────────────────────────
 *
 * The server answers 501 with `code: 'stock_unavailable'` when no provider key
 * is set. That is a deployment fact, not a failure the user caused, so it gets
 * an explanatory panel rather than a red error — and the rest of the studio is
 * unaffected either way.
 */
import React from "react";
import { generateId } from "@openvideo/core";
import { core, projectStore, getHostCallbacks } from "../runtime";
import { ScrollArea, Input } from "../ui";

type Kind = "image" | "video";

const DEFAULT_DURATION_US = 5_000_000;

export default function StockPanel() {
  const [kind, setKind] = React.useState<Kind>("image");
  const [query, setQuery] = React.useState("");
  const [items, setItems] = React.useState<any[]>([]);
  const [status, setStatus] = React.useState<"idle" | "loading" | "ready" | "error" | "off">(
    "idle"
  );
  const [message, setMessage] = React.useState("");

  const search = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const needle = query.trim();
    if (!needle) return;

    const searchStock = getHostCallbacks().searchStock;
    if (!searchStock) {
      setStatus("off");
      setMessage("Stock search is not available in this editor.");
      return;
    }

    setStatus("loading");
    setMessage("");
    try {
      const result = await searchStock(kind, needle, 1);
      setItems(result.items || []);
      setStatus("ready");
      if (!result.items?.length) setMessage(`Nothing found for “${needle}”.`);
    } catch (cause: any) {
      if (cause?.code === "stock_unavailable") {
        setStatus("off");
        setMessage(
          "Stock search needs a provider key on the server. Once PEXELS_API_KEY is set, this tab works with no other changes."
        );
        return;
      }
      setStatus("error");
      setMessage(cause?.message || "Search failed. Please try again.");
    }
  };

  const addItem = (item: any) => {
    const settings = (projectStore.getState() as any).settings || {};
    const compWidth = settings.width || 1080;
    const compHeight = settings.height || 1920;

    // Fit the asset inside the canvas without distorting it. Stretching stock
    // footage to the frame is the single most obvious way a video looks wrong.
    const ratio = (item.width || compWidth) / (item.height || compHeight);
    let width = compWidth;
    let height = Math.round(width / ratio);
    if (height > compHeight) {
      height = compHeight;
      width = Math.round(height * ratio);
    }

    const duration =
      kind === "video" && item.durationUs ? Math.max(1, item.durationUs) : DEFAULT_DURATION_US;

    core.clip.add({
      id: generateId(),
      type: kind === "video" ? "Video" : "Image",
      name: item.name || "Stock asset",
      src: item.url,
      timing: {
        display: { from: 0, to: duration },
        trim: { from: 0, to: duration },
        duration,
        playbackRate: 1,
      },
      transform: {
        x: Math.round((compWidth - width) / 2),
        y: Math.round((compHeight - height) / 2),
        width,
        height,
        angle: 0,
        opacity: 1,
        zIndex: 1,
      },
      style: {},
      // Attribution rides along on the clip. Pexels does not require it, but
      // losing track of where an asset came from is how a template ends up
      // unshippable later.
      metadata: { stock: item.credit || null },
      locked: false,
    } as any);
  };

  const tab = (value: Kind, label: string) => (
    <button
      type="button"
      onClick={() => {
        setKind(value);
        setItems([]);
        setStatus("idle");
        setMessage("");
      }}
      className={
        "flex-1 rounded px-2 py-1 text-[11px] font-semibold transition-colors " +
        (kind === value
          ? "bg-accent text-foreground"
          : "text-muted-foreground hover:text-foreground")
      }
    >
      {label}
    </button>
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 px-3 pt-3">
        <p className="pb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Stock
        </p>
        <div className="mb-2 flex gap-1 rounded border border-border bg-muted/60 p-0.5">
          {tab("image", "Photos")}
          {tab("video", "Videos")}
        </div>
        <form onSubmit={search}>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={kind === "image" ? "Search photos" : "Search videos"}
            aria-label={kind === "image" ? "Search stock photos" : "Search stock videos"}
            className="h-7 text-xs"
          />
        </form>
      </div>

      <ScrollArea className="min-h-0 flex-1 px-3 pb-4 pt-3">
        {status === "loading" && (
          <p className="pt-4 text-center text-[11px] text-muted-foreground">Searching…</p>
        )}

        {status === "off" && (
          <div className="pt-4">
            <p className="text-[11px] font-semibold text-foreground">Stock search is off</p>
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{message}</p>
          </div>
        )}

        {status === "error" && (
          <div className="mt-2 rounded border border-brand-danger/40 bg-brand-danger/10 p-2">
            <p className="text-[11px] leading-snug text-brand-danger">{message}</p>
          </div>
        )}

        {status === "idle" && (
          <p className="pt-4 text-center text-[11px] leading-snug text-muted-foreground">
            Search for something to drop straight onto the timeline.
          </p>
        )}

        {status === "ready" && !items.length && (
          <p className="pt-4 text-center text-[11px] text-muted-foreground">{message}</p>
        )}

        {items.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => addItem(item)}
                title={`Add ${item.name}`}
                className="group relative aspect-square overflow-hidden rounded border border-border bg-muted/60 transition-colors hover:border-primary/60"
              >
                <img
                  src={item.thumbnail || item.url}
                  alt={item.name}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                {item.credit?.author && (
                  <span className="absolute inset-x-0 bottom-0 truncate bg-black/70 px-1 py-0.5 text-[9px] text-white/80">
                    {item.credit.author}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
