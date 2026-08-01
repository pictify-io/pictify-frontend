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
  searchCatalogue,
} from "../../../agent-tools";
import { EFFECT_OPTIONS } from "../../../effects";
import { IN_PRESETS, OUT_PRESETS, buildAnimation, withAnimationMeta } from "../../../animations";
import {
  TRANSITION_OPTIONS,
  previousClip,
  incomingTransition,
  createTransitionClip,
} from "../../../transitions";

type Turn = {
  role: "user" | "assistant";
  text: string;
  errors?: string[];
};

/** Enough rounds for a multi-step request; few enough that a loop cannot run away. */
const MAX_ROUNDS = 6;
/** A hard ceiling on edits per request, so a misread instruction cannot rewrite the scene. */
const MAX_OPERATIONS = 30;

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

  /**
   * Carry out one batch of operations, reporting what could not be done.
   *
   * Failures are collected rather than thrown: the agent needs to SEE that a
   * transition had nothing before it, so the next round can do something else.
   * Throwing would end the run on the first imperfect step.
   */
  const applyOperations = async (operations: any[]) => {
    const failures: string[] = [];
    for (const operation of operations) {
      const state: any = projectStore.getState();

      if (operation.op === "add") {
        core.clip.add({ id: generateId(), ...operation.clip } as any);
      } else if (operation.op === "remove") {
        core.clip.remove([operation.clipId]);
      } else if (operation.op === "animate") {
        // Resolved here because composing presets into keyframes needs the
        // engine's preset registry, which the pure tool module cannot import.
        const clip = state.clips[operation.clipId];
        const display = clip?.timing?.display || {};
        const durationUs = Math.max(0, (display.to ?? 0) - (display.from ?? 0));
        const selection = {
          inPreset: operation.inPreset,
          outPreset: operation.outPreset,
          emphasisPreset: "",
        };
        core.clip.update(operation.clipId, {
          animations: buildAnimation(selection, durationUs) ?? [],
          metadata: withAnimationMeta(clip, selection),
        });
      } else if (operation.op === "transition") {
        // A transition is its own clip joining a PAIR, so it needs the track
        // order to find what comes before.
        const clip = state.clips[operation.clipId];
        const previous = previousClip(state.clips, state.tracks, clip);
        if (!previous) {
          failures.push("add_transition: nothing before that clip to blend from.");
        } else {
          const existing = incomingTransition(state.clips, clip);
          if (existing) core.clip.remove([existing.id]);
          core.clip.add(
            createTransitionClip({
              fromClip: previous,
              toClip: clip,
              key: operation.transitionKey,
              durationUs: operation.durationUs,
            }) as any
          );
        }
      } else if (operation.op === "stock") {
        // The only operation that needs the network.
        const search = getHostCallbacks().searchStock;
        if (!search) {
          failures.push("add_stock: stock search is not available.");
          continue;
        }
        try {
          const found = await search(operation.kind, operation.query, 1);
          const item = found?.items?.[0];
          if (!item) {
            failures.push(`add_stock: nothing found for "${operation.query}".`);
            continue;
          }
          const settings = state.settings || {};
          const compW = settings.width || 1080;
          const compH = settings.height || 1920;
          // Fit inside the canvas without distorting: stretching stock
          // footage to the frame is the most obvious way a video looks wrong.
          const ratio = (item.width || compW) / (item.height || compH);
          let w = compW;
          let h = Math.round(w / ratio);
          if (h > compH) {
            h = compH;
            w = Math.round(h * ratio);
          }
          const span = Math.max(1, operation.durationUs);
          core.clip.add({
            id: generateId(),
            type: operation.kind === "video" ? "Video" : "Image",
            name: item.name || "Stock",
            src: item.url,
            timing: {
              display: { from: operation.fromUs, to: operation.fromUs + span },
              trim: { from: 0, to: span },
              duration: span,
              playbackRate: 1,
            },
            transform: {
              x: Math.round((compW - w) / 2),
              y: Math.round((compH - h) / 2),
              width: w,
              height: h,
              angle: 0,
              opacity: 1,
              zIndex: 1,
            },
            style: {},
            metadata: { stock: item.credit || null },
            locked: false,
          } as any);
        } catch (cause: any) {
          failures.push(`add_stock: ${cause?.message || "search failed"}.`);
        }
      } else {
        core.clip.update(operation.clipId, operation.patch);
      }
      }
    return failures;
  };

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

      /*
       * The catalogues stay OUT of the prompt.
       *
       * Pasting them in costs thousands of tokens every turn to name 51
       * effects, 123 presets and 68 transitions, nearly all of which the
       * request never mentions. Instead the model looks things up: it asks for
       * "film", gets `oldFilm` back, and calls add_effect with a name that
       * exists. One extra round trip on the requests that need it, nothing on
       * the ones that do not.
       */
      const vocabulary = {
        effects: EFFECT_OPTIONS().map((option: any) => option.value),
        animations: [...IN_PRESETS(), ...OUT_PRESETS()].map((option: any) => option.value),
        transitions: TRANSITION_OPTIONS().map((option: any) => option.value),
      };

      /*
       * The agent loop: act, LOOK at what happened, decide what is next.
       *
       * A single round can only ever do what the model guessed from the opening
       * state. Real requests are not like that — "make this feel like a trailer"
       * is several edits, and whether the third is needed depends on how the
       * second turned out. So each round is handed the document AS IT NOW IS,
       * plus what the last round actually managed and what it could not.
       *
       * It ends when the model stops asking for anything, when a round achieves
       * nothing, or when the budget runs out. The middle case is the one that
       * matters: a model repeating a call that keeps failing would otherwise
       * spin until the user gave up.
       */
      const history: Array<{ role: string; content: string }> = [];
      const failures: string[] = [];
      let totalOperations = 0;
      let message = "";
      let stopped = "";

      for (let round = 0; round < MAX_ROUNDS; round += 1) {
        const live: any = projectStore.getState();
        const reply = await plan(describeDocument(live), toolSchema(), instruction, history);
        message = reply.message || message;

        if (!reply.calls?.length) {
          // An empty call list is how the model says it is finished.
          break;
        }

        // Validated against the LIVE document each round, not the snapshot the
        // model was given: its own last round moved things.
        const planned = planToolCalls(projectStore.getState() as any, reply.calls, vocabulary);
        const lookups = planned.operations.filter((op: any) => op.op === "query");
        const mutations = planned.operations.filter((op: any) => op.op !== "query");

        for (const error of planned.errors) failures.push(`${error.name}: ${error.error}`);

        const answers = lookups.map((lookup: any) => {
          const found = searchCatalogue(
            vocabulary[lookup.list as keyof typeof vocabulary],
            lookup.query
          );
          return `${lookup.list} matching "${lookup.query}" (${found.total} total): ${found.names.join(", ")}`;
        });

        const applyFailures = mutations.length ? await applyOperations(mutations) : [];
        for (const failure of applyFailures) failures.push(failure);
        totalOperations += mutations.length;

        if (mutations.length) {
          // Each step lands in the transcript as it happens, so a run that
          // takes four rounds does not look like a hang.
          const step = summarizeOperations(mutations);
          setTurns((prev) => [...prev, { role: "assistant", text: `${round + 1}. ${step}` }]);
          getHostCallbacks().onClipStyleChange?.(mutations[0].clipId || "");
        }

        // A round that neither looked anything up nor changed anything is not
        // going to do better on the next attempt.
        if (!lookups.length && !mutations.length) {
          stopped = "It could not carry that out.";
          break;
        }
        if (totalOperations >= MAX_OPERATIONS) {
          stopped = "Stopped after a lot of changes — check the result before asking for more.";
          break;
        }
        if (round === MAX_ROUNDS - 1) {
          stopped = "Stopped after several rounds. Ask again to continue.";
        }

        // What it did, what it could not, and where things now stand.
        history.push({ role: "assistant", content: JSON.stringify({ calls: reply.calls }) });
        history.push({
          role: "user",
          content: [
            answers.join("\n"),
            mutations.length ? `Applied: ${summarizeOperations(mutations)}` : "",
            applyFailures.length ? `Failed: ${applyFailures.join("; ")}` : "",
            `Scene now: ${JSON.stringify(describeDocument(projectStore.getState() as any))}`,
            "Continue if the request is not finished. Return an empty calls list when it is done.",
          ]
            .filter(Boolean)
            .join("\n"),
        });
      }

      const summary =
        totalOperations > 0
          ? `Done — ${totalOperations} change${totalOperations === 1 ? "" : "s"}.`
          : "Nothing changed.";

      setTurns((prev) => [
        ...prev,
        {
          role: "assistant",
          text: [message, summary, stopped].filter(Boolean).join(" "),
          errors: failures,
        },
      ]);
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
