/*
 * The timeline copilot (written for Pictify).
 *
 * Describe a change and the scene is edited for you. The Remotion side of the
 * studio has had this for a while by rewriting the whole composition; a
 * timeline scene cannot work that way, because the user positioned those clips
 * and regenerating the graph would discard that on every request.
 *
 * So the model returns TOOL CALLS, and this validates every one of them against
 * the live document before applying it — see ../../../agent-tools.js. A
 * hallucinated clip id costs one operation and reports itself; it does not
 * corrupt the scene.
 *
 * ── Every turn says what actually happened ────────────────────────────────
 *
 * "Changed 2 clips" and "I couldn't find that clip" are different outcomes and
 * both are useful. An edit that silently did nothing looks exactly like one
 * that worked, which is the failure that makes an assistant untrustworthy — so
 * refusals and partial successes are reported as plainly as wins.
 */
import React from "react";
import { generateId } from "@openvideo/core";
import { core, projectStore, getHostCallbacks } from "../runtime";
import { ScrollArea } from "../ui";
import {
  describeDocument,
  toolSchema,
  planToolCalls,
  summarizeOperations,
} from "../../../agent-tools";

type Turn = {
  role: "user" | "assistant";
  text: string;
  errors?: string[];
};

const SUGGESTIONS = [
  "Make the title bigger and move it up",
  "Change the accent colour to orange",
  "Hold the lower third for two more seconds",
];

export default function CopilotPanel() {
  const [turns, setTurns] = React.useState<Turn[]>([]);
  const [draft, setDraft] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const lastCount = React.useRef(0);

  /*
   * Follow the conversation as it grows.
   *
   * useEffect, NOT a reactive read during render, and guarded on the message
   * count. An earlier version of this pattern in the Remotion chat scheduled an
   * update from inside the reactive block and froze the tab: the block re-ran
   * on its own update and never settled.
   */
  React.useEffect(() => {
    if (!listRef.current || turns.length === lastCount.current) return;
    lastCount.current = turns.length;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [turns.length]);

  const send = async (text?: string) => {
    const instruction = String(text ?? draft).trim();
    if (!instruction || busy) return;

    setDraft("");
    setTurns((prev) => [...prev, { role: "user", text: instruction }]);
    setBusy(true);

    try {
      const plan = getHostCallbacks().planAgentEdit;
      if (!plan) throw new Error("The copilot is not available in this editor.");

      const document: any = projectStore.getState();
      const reply = await plan(describeDocument(document), toolSchema(), instruction);

      // Validated against the LIVE document, not the snapshot sent to the
      // model: the user may have moved something while it was thinking.
      const { operations, errors } = planToolCalls(
        projectStore.getState() as any,
        reply.calls || []
      );

      for (const operation of operations) {
        if (operation.op === "add") core.clip.add({ id: generateId(), ...operation.clip } as any);
        else if (operation.op === "remove") core.clip.remove([operation.clipId]);
        else core.clip.update(operation.clipId, operation.patch);
      }

      const summary = summarizeOperations(operations);
      setTurns((prev) => [
        ...prev,
        {
          role: "assistant",
          text: reply.message ? `${reply.message} ${summary}` : summary,
          errors: errors.map((e) => `${e.name}: ${e.error}`),
        },
      ]);
      if (operations.length) getHostCallbacks().onClipStyleChange?.(operations[0].clipId || "");
    } catch (cause: any) {
      setTurns((prev) => [
        ...prev,
        { role: "assistant", text: cause?.message || "That did not work. Try rephrasing it." },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={listRef} className="ov-scroll min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {!turns.length && (
          <div className="pt-2">
            <p className="text-[11px] font-bold leading-snug text-foreground">
              Describe a change and the scene is edited for you.
            </p>
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
              Every edit is checked against your scene first, so a change that cannot be made is
              refused rather than guessed at.
            </p>
            <div className="mt-3 flex flex-col gap-1.5">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => send(suggestion)}
                  disabled={busy}
                  className="rounded border border-border bg-muted/60 px-2 py-1.5 text-left text-[11px] text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {turns.map((turn, index) =>
          turn.role === "user" ? (
            <div key={index} className="mb-2 flex justify-end">
              <p className="max-w-[85%] rounded-lg rounded-br-sm border-[2px] border-black bg-brand-accent px-2 py-1.5 text-[11px] font-bold leading-snug text-black">
                {turn.text}
              </p>
            </div>
          ) : (
            <div key={index} className="mb-3">
              <p className="max-w-[90%] rounded-lg rounded-bl-sm border border-border bg-muted/60 px-2 py-1.5 text-[11px] leading-snug text-foreground">
                {turn.text}
              </p>
              {/* The refusals, in the tool's own words. "It didn't work" tells
                  you nothing you can act on; "no clip with id x" tells you the
                  model guessed, and asking again usually fixes it. */}
              {turn.errors?.length ? (
                <div className="mt-1 rounded border border-brand-danger/40 bg-brand-danger/10 p-1.5">
                  {turn.errors.map((error) => (
                    <p key={error} className="font-mono text-[10px] leading-snug text-brand-danger">
                      {error}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          )
        )}

        {busy && (
          <div className="flex items-center gap-2 px-1 py-1 text-[11px] text-muted-foreground">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-accent" />
            Working out what to change…
          </div>
        )}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
        className="shrink-0 border-t-[3px] border-black bg-muted/40 p-2"
      >
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            // The studio's hotkeys must not fire while a sentence is being
            // typed — "d" duplicates a clip and Backspace deletes one.
            event.stopPropagation();
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              send();
            }
          }}
          disabled={busy}
          rows={2}
          placeholder="Make the title bigger…"
          aria-label="Describe a change for the copilot to make"
          className="w-full resize-none rounded border border-border bg-background px-2 py-1.5 text-[11px] leading-snug text-foreground outline-none transition-colors focus:border-primary/60 disabled:opacity-60"
        />
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">Enter to send</span>
          <button
            type="submit"
            disabled={busy || !draft.trim()}
            className="rounded border-[2px] border-black bg-brand-accent px-3 py-1 text-[10px] font-black uppercase tracking-widest text-black transition-all hover:-translate-y-px disabled:translate-y-0 disabled:opacity-40"
          >
            {busy ? "Editing…" : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
