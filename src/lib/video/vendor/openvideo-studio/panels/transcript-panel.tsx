/*
 * Editing video by editing its transcript (written for Pictify).
 *
 * Delete a sentence and the matching stretch of video goes with it. For
 * talking-head footage this beats scrubbing for the same moment by a wide
 * margin, and the transcription that powers it is already there for captions.
 *
 * ── Marked, then applied ──────────────────────────────────────────────────
 *
 * Sentences are struck through as you select them and nothing is cut until
 * "Remove" is pressed. Cutting on each click would mean the transcript
 * reflowed under the cursor mid-edit, and every mistake would need an undo
 * rather than a second click.
 *
 * The cut itself is destructive — see ../../../transcript-edit.js, which owns
 * the arithmetic and is where the two clocks (source time for words, timeline
 * time for clips) are kept apart.
 */
import React from "react";
import { generateId } from "@openvideo/core";
import { core, projectStore, getHostCallbacks } from "../runtime";
import { ScrollArea } from "../ui";
import {
  groupSentences,
  rangesForWords,
  planCuts,
  removedTimelineSpan,
} from "../../../transcript-edit";

const SPEECH_TYPES = new Set(["Video", "Audio"]);
const seconds = (us: number) => `${Math.round((us / 1_000_000) * 10) / 10}s`;

export default function TranscriptPanel() {
  const [clipId, setClipId] = React.useState<string | null>(null);
  const [words, setWords] = React.useState<any[]>([]);
  const [removed, setRemoved] = React.useState<Set<number>>(new Set());
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [done, setDone] = React.useState("");

  const state: any = projectStore.getState();
  const sources = Object.values(state.clips || {}).filter(
    (clip: any) => SPEECH_TYPES.has(clip?.type) && clip?.src
  );

  const sentences = React.useMemo(() => groupSentences(words), [words]);
  const clip: any = clipId ? (projectStore.getState() as any).clips?.[clipId] : null;

  // What the pending selection would actually cost, in timeline time. A cut
  // with no visible consequence is worth knowing about before pressing it.
  const pendingUs = React.useMemo(() => {
    if (!clip || !removed.size) return 0;
    return removedTimelineSpan(clip, rangesForWords(words, removed));
  }, [clip, words, removed]);

  const transcribe = async (source: any) => {
    const fn = getHostCallbacks().transcribe;
    if (!fn) {
      setError("Transcription is not available in this editor.");
      return;
    }
    setBusy(true);
    setError("");
    setDone("");
    setRemoved(new Set());
    try {
      const result = await fn(source.src);
      setWords(result.words || []);
      setClipId(source.id);
      if (!result.words?.length) setError("No speech was found in that clip.");
    } catch (cause: any) {
      setError(cause?.message || "Transcription failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const toggle = (indices: number[]) => {
    setRemoved((prev) => {
      const next = new Set(prev);
      const isRemoved = indices.every((i) => next.has(i));
      for (const i of indices) {
        if (isRemoved) next.delete(i);
        else next.add(i);
      }
      return next;
    });
  };

  const applyCuts = () => {
    if (!clipId || !removed.size) return;
    const doc: any = projectStore.getState();
    const plan = planCuts(doc, clipId, rangesForWords(words, removed), () => generateId());

    // Removals first: adding a piece before deleting the original would leave
    // two clips claiming the same span for a frame.
    if (plan.removeIds.length) core.clip.remove(plan.removeIds);
    for (const [id, next] of Object.entries(plan.clips)) {
      if (doc.clips[id]) core.clip.update(id, next as any);
      else core.clip.add(next as any);
    }

    // The words that survive, so the transcript matches the video again.
    setWords((prev) => prev.filter((_, i) => !removed.has(i)));
    setRemoved(new Set());
    setDone(`Removed ${seconds(plan.removedUs)}.`);
    getHostCallbacks().onClipStyleChange?.(clipId);
  };

  if (!clipId) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="shrink-0 px-3 pt-3">
          <p className="pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Transcript
          </p>
          <p className="pb-2 text-[11px] leading-snug text-muted-foreground">
            Pick a clip. Delete sentences from its transcript and the video is cut to match.
          </p>
        </div>
        <ScrollArea className="min-h-0 flex-1 px-3 pb-4">
          {!sources.length ? (
            <p className="pt-6 text-center text-[11px] leading-snug text-muted-foreground">
              Add a video or audio clip to the timeline first.
            </p>
          ) : (
            <div className="flex flex-col gap-1.5 pt-1">
              {sources.map((source: any) => (
                <button
                  key={source.id}
                  type="button"
                  disabled={busy}
                  onClick={() => transcribe(source)}
                  className="flex items-center justify-between gap-2 rounded border border-border bg-muted/60 px-2 py-2 text-left transition-colors hover:border-primary/60 hover:bg-accent disabled:opacity-50"
                >
                  <span className="min-w-0 truncate text-[11px] font-semibold text-foreground">
                    {source.name || source.type}
                  </span>
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    {busy ? "Working…" : "Transcribe"}
                  </span>
                </button>
              ))}
            </div>
          )}
          {error && (
            <div className="mt-3 rounded border border-brand-danger/40 bg-brand-danger/10 p-2">
              <p className="text-[11px] leading-snug text-brand-danger">{error}</p>
            </div>
          )}
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Transcript
          </p>
          <button
            type="button"
            onClick={() => {
              setClipId(null);
              setWords([]);
              setRemoved(new Set());
            }}
            className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
          >
            Back
          </button>
        </div>
        <p className="mt-1 text-[10px] leading-snug text-muted-foreground">
          Click a sentence to mark it for removal.
        </p>
      </div>

      <ScrollArea className="min-h-0 flex-1 px-3 py-2">
        {sentences.map((sentence, index) => {
          const marked = sentence.indices.every((i) => removed.has(i));
          return (
            <button
              key={index}
              type="button"
              onClick={() => toggle(sentence.indices)}
              className={
                "mb-1 block w-full rounded px-2 py-1.5 text-left text-[11px] leading-relaxed transition-colors " +
                (marked
                  ? "bg-brand-danger/15 text-muted-foreground line-through"
                  : "text-foreground hover:bg-accent")
              }
            >
              {sentence.text}
            </button>
          );
        })}
      </ScrollArea>

      {removed.size > 0 && (
        <div className="shrink-0 border-t-[3px] border-black bg-gray-900 p-2">
          <p className="pb-1.5 text-[10px] leading-snug text-muted-foreground">
            Removing {seconds(pendingUs)} of video. Clips after this one move earlier to close the
            gap.
          </p>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setRemoved(new Set())}
              className="flex-1 rounded border-[2px] border-black bg-gray-800 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-gray-100 transition-colors hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={applyCuts}
              className="flex-1 rounded border-[2px] border-black bg-brand-danger px-2 py-1 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:-translate-y-px"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {done && !removed.size && (
        <div className="shrink-0 border-t border-border px-3 py-2">
          <p className="text-[10px] text-muted-foreground">{done}</p>
        </div>
      )}
    </div>
  );
}
