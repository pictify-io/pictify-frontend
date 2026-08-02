/*
 * Captions tab (written for Pictify; upstream's equivalent is
 * src/components/editor/media-panel/panel/captions.tsx).
 *
 * Captions are generated FROM a clip already on the timeline, not from a file
 * picker. That is the whole flow: pick the audio or video you already placed,
 * and get caption clips lined up against it. Asking for an upload here would
 * make people add the same media twice, and captions transcribed from a
 * different file than the one on the timeline would drift.
 *
 * ── Why the clip's own start matters ──────────────────────────────────────
 *
 * The transcript is relative to the start of the MEDIA. The clip it came from
 * may sit anywhere on the timeline, so every caption is shifted by the clip's
 * display start — otherwise captions for a clip dropped at 0:10 all appear at
 * 0:00. That shift is `offsetUs`, handled in ../../../captions.js.
 */
import React from "react";
import { useStore } from "zustand";
import { generateId } from "@openvideo/core";
import { core, projectStore, getHostCallbacks } from "../runtime";
import { ScrollArea, Button } from "../ui";
import { buildCaptionClips, transcriptPreview } from "../../../captions";

/** Clips that could plausibly contain speech. */
const SPEECH_TYPES = new Set(["Video", "Audio"]);

export default function CaptionsPanel() {
  const clips = useStore(projectStore, (state: any) => state.clips);
  const settings = useStore(projectStore, (state: any) => state.settings);

  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [error, setError] = React.useState("");
  const [lastResult, setLastResult] = React.useState<{ count: number; preview: string } | null>(
    null
  );

  const sources = React.useMemo(
    () =>
      Object.values(clips || {})
        .filter((clip: any) => SPEECH_TYPES.has(clip?.type) && clip?.src)
        .sort((a: any, b: any) => (a.timing?.display?.from ?? 0) - (b.timing?.display?.from ?? 0)),
    [clips]
  );

  const generate = async (clip: any) => {
    const transcribe = getHostCallbacks().transcribe;
    if (!transcribe) {
      setError("Captioning is not available in this editor.");
      return;
    }

    setBusyId(clip.id);
    setError("");
    setLastResult(null);
    try {
      const result = await transcribe(clip.src);
      const captions = buildCaptionClips(result.words, {
        composition: {
          width: settings?.width || 1080,
          height: settings?.height || 1920,
        },
        // Captions line up against the clip where it actually sits.
        offsetUs: clip.timing?.display?.from ?? 0,
        mediaId: clip.id,
      });

      if (!captions.length) {
        setError("No speech was found in that clip.");
        return;
      }
      for (const caption of captions) {
        core.clip.add({ id: generateId(), ...caption } as any);
      }
      setLastResult({ count: captions.length, preview: transcriptPreview(result.words) });
    } catch (cause: any) {
      // The server's message names the real problem ("media file is corrupt",
      // "not configured"); "Something went wrong" sends people to support.
      setError(cause?.message || "Captioning failed. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 px-3 pt-3">
        <p className="pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Captions
        </p>
        <p className="pb-1 text-[11px] leading-snug text-muted-foreground">
          Pick a clip with speech. Its words are transcribed and added as caption clips, timed to
          the audio.
        </p>
        <p className="pb-2 text-[11px] leading-snug text-muted-foreground">
          1 AI credit per minute of audio.
        </p>
      </div>

      <ScrollArea className="min-h-0 flex-1 px-3 pb-4">
        {!sources.length ? (
          <div className="pt-6 text-center">
            <p className="text-[11px] font-semibold text-foreground">Nothing to caption yet</p>
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
              Add a video or audio clip to the timeline, then come back.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 pt-1">
            {sources.map((clip: any) => (
              <button
                key={clip.id}
                type="button"
                disabled={busyId !== null}
                onClick={() => generate(clip)}
                className="flex items-center justify-between gap-2 rounded border border-border bg-muted/60 px-2 py-2 text-left transition-colors hover:border-primary/60 hover:bg-accent disabled:opacity-50"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[11px] font-semibold text-foreground">
                    {clip.name || clip.type}
                  </span>
                  <span className="block text-[10px] text-muted-foreground">
                    {clip.type} · starts at{" "}
                    {(((clip.timing?.display?.from ?? 0) / 1_000_000) | 0).toString()}s
                  </span>
                </span>
                <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  {busyId === clip.id ? "Working…" : "Caption"}
                </span>
              </button>
            ))}
          </div>
        )}

        {busyId && (
          <p className="mt-3 text-[11px] text-muted-foreground">
            Transcribing. This takes a few seconds for a short clip, longer for a long one.
          </p>
        )}

        {error && (
          <div className="mt-3 rounded border border-brand-danger/40 bg-brand-danger/10 p-2">
            <p className="text-[11px] leading-snug text-brand-danger">{error}</p>
          </div>
        )}

        {lastResult && (
          <div className="mt-3 rounded border border-border bg-muted/40 p-2">
            <p className="text-[11px] font-semibold text-foreground">
              Added {lastResult.count} caption{lastResult.count === 1 ? "" : "s"}
            </p>
            <p className="mt-1 text-[10px] leading-snug text-muted-foreground">
              {lastResult.preview}
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
