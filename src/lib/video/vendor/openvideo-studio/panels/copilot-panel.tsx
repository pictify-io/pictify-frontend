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
import { useMediaLibrary } from "../media-store";
import { ScrollArea } from "../ui";
import {
  describeDocument,
  toolSchema,
  planToolCalls,
  summarizeOperations,
  searchCatalogue,
  describeMedia,
} from "../../../agent-tools";
import {
  classifyRequest,
  budgetFor,
  roundReport,
  shouldReview,
  condenseBrief,
} from "../../../agent-orchestrator";
import { critiqueScene } from "../../../scene-critic";
import { EFFECT_OPTIONS } from "../../../effects";
import {
  IN_PRESETS,
  OUT_PRESETS,
  EMPHASIS_PRESETS,
  buildAnimation,
  withAnimationMeta,
} from "../../../animations";
import { buildCaptionClips } from "../../../captions";
import { getGroupedFonts } from "../font-utils";
import { fontManager } from "@openvideo/engine-pixi";
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
  /** The scene as it was BEFORE this run, for one-click restore. */
  restore?: any;
};

const SUGGESTIONS = [
  "Create a 15 second promo video for a product launch",
  "Make the title bigger and move it up",
  "Change the accent colour to orange",
];

export default function CopilotPanel() {
  const [turns, setTurns] = React.useState<Turn[]>([]);
  const [draft, setDraft] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  // Which pipeline phase is running, for the busy line. A generation takes
  // long enough that "working…" for a minute reads as a hang; "designing",
  // "building", "reviewing" reads as progress.
  const [phase, setPhase] = React.useState("Working out what to change…");
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
  /**
   * Drop a media item onto the canvas, fitted rather than stretched.
   *
   * Shared by add_stock and add_media: the only difference between them is
   * where the item came from, and stretching footage to the frame is the most
   * obvious way a video looks wrong either way.
   */
  const placeMedia = (item: any, operation: any, state: any, failures: string[]) => {
    const settings = state.settings || {};
    const compW = settings.width || 1080;
    const compH = settings.height || 1920;
    const isVideo = operation.kind === "video" || item.kind === "video";

    const ratio = (item.width || compW) / (item.height || compH);
    let w = compW;
    let h = Math.round(w / ratio);
    if (h > compH) {
      h = compH;
      w = Math.round(h * ratio);
    }

    if (!item.url) {
      failures.push(`add_media: "${item.name}" has no usable file.`);
      return;
    }

    const span = Math.max(1, operation.durationUs);
    core.clip.add({
      id: generateId(),
      type: isVideo ? "Video" : item.kind === "audio" ? "Audio" : "Image",
      name: item.name || "Media",
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
      metadata: item.credit ? { stock: item.credit } : {},
      locked: false,
    } as any);
  };

  const applyOperations = async (operations: any[]) => {
    const failures: string[] = [];

    /*
     * Each operation is isolated.
     *
     * Without this, one throw from the engine escapes the whole run: the loop
     * stops mid-batch, the remaining operations never happen, and the scene is
     * left half-edited with the agent's own record of what it did now wrong.
     * A failure that costs one operation and reports itself is recoverable; one
     * that abandons the batch silently is what makes a scene look broken.
     */
    const isolate = (label: string, work: () => void) => {
      try {
        work();
      } catch (cause: any) {
        failures.push(`${label}: ${cause?.message || "the engine refused that change"}`);
      }
    };
    for (const operation of operations) {
      const state: any = projectStore.getState();

      if (operation.op === "add") {
        isolate(operation.tool || "add", () =>
          core.clip.add({ id: generateId(), ...operation.clip } as any)
        );
      } else if (operation.op === "remove") {
        isolate("delete_clip", () => core.clip.remove([operation.clipId]));
      } else if (operation.op === "settings") {
        // Scene-level: background colour, total duration. The engine merges
        // the patch into settings itself.
        isolate("scene settings", () => core.project.updateSettings(operation.patch));
      } else if (operation.op === "media") {
        /*
         * Resolved here because the panel holds the media library. Matched by
         * NAME — exact first, then substring — because that is what the model
         * was shown and what the user would say out loud.
         */
        const items = useMediaLibrary.getState().items || [];
        const needle = String(operation.name || "").toLowerCase();
        const item =
          items.find((entry: any) => (entry.name || "").toLowerCase() === needle) ||
          items.find((entry: any) => (entry.name || "").toLowerCase().includes(needle));
        if (!item) {
          const known = items
            .slice(0, 5)
            .map((entry: any) => `"${entry.name}"`)
            .join(", ");
          failures.push(
            `add_media: nothing in the library called "${operation.name}".${known ? ` It has: ${known}.` : ""}`
          );
        } else {
          isolate("add_media", () => placeMedia(item, operation, state, failures));
        }
      } else if (operation.op === "font") {
        /*
         * Resolved here because a font is a FILE: the engine has to load it
         * before the style points at it, or the clip paints the fallback font
         * forever. Family matched case-insensitively — the validator already
         * checked it against the same list this resolves from.
         */
        const clip = state.clips[operation.clipId];
        if (!clip) {
          failures.push(`set_font: clip ${operation.clipId} no longer exists.`);
          continue;
        }
        const family = String(operation.family || "").toLowerCase();
        const target = getGroupedFonts().find(
          (entry: any) => entry.family.toLowerCase() === family
        );
        if (!target) {
          failures.push(`set_font: no font family called "${operation.family}".`);
          continue;
        }
        try {
          await fontManager.addFont({
            name: target.mainFont.postScriptName,
            url: target.mainFont.url,
          });
          core.clip.update(operation.clipId, {
            style: {
              ...(clip.style || {}),
              fontFamily: target.mainFont.postScriptName,
              fontUrl: target.mainFont.url,
            },
          });
        } catch (cause: any) {
          failures.push(`set_font: ${cause?.message || "the font could not be loaded"}.`);
        }
      } else if (operation.op === "captions") {
        // Resolved here because the panel owns the transcription service.
        // Mirrors the captions panel's own generate flow exactly.
        const transcribe = getHostCallbacks().transcribe;
        if (!transcribe) {
          failures.push("add_captions: captioning is not available in this editor.");
          continue;
        }
        const clip = state.clips[operation.clipId];
        if (!clip) {
          failures.push(`add_captions: clip ${operation.clipId} no longer exists.`);
          continue;
        }
        try {
          const result = await transcribe(clip.src);
          const captions = buildCaptionClips(result.words, {
            composition: {
              width: state.settings?.width || 1080,
              height: state.settings?.height || 1920,
            },
            // Captions line up against the clip where it actually sits.
            offsetUs: clip.timing?.display?.from ?? 0,
            mediaId: clip.id,
          });
          if (!captions.length) {
            failures.push("add_captions: no speech was found in that clip.");
            continue;
          }
          for (const caption of captions) {
            isolate("add_captions", () => core.clip.add({ id: generateId(), ...caption } as any));
          }
        } catch (cause: any) {
          failures.push(`add_captions: ${cause?.message || "transcription failed"}.`);
        }
      } else if (operation.op === "animate") {
        // Resolved here because composing presets into keyframes needs the
        // engine's preset registry, which the pure tool module cannot import.
        const clip = state.clips[operation.clipId];
        if (!clip) {
          failures.push(`set_animation: clip ${operation.clipId} no longer exists.`);
          continue;
        }
        const display = clip?.timing?.display || {};
        const durationUs = Math.max(0, (display.to ?? 0) - (display.from ?? 0));
        const selection = {
          inPreset: operation.inPreset,
          outPreset: operation.outPreset,
          emphasisPreset: operation.emphasisPreset || "",
        };
        isolate("set_animation", () =>
          core.clip.update(operation.clipId, {
            animations: buildAnimation(selection, durationUs) ?? [],
            metadata: withAnimationMeta(clip, selection),
          })
        );
      } else if (operation.op === "transition") {
        // A transition is its own clip joining a PAIR, so it needs the track
        // order to find what comes before.
        const clip = state.clips[operation.clipId];
        const previous = previousClip(state.clips, state.tracks, clip);
        if (!previous) {
          failures.push("add_transition: nothing before that clip to blend from.");
        } else {
          isolate("add_transition", () => {
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
          });
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
      } else if (operation.op === "update") {
        /*
         * Re-checked at APPLY time, not just at planning: the batch was
         * validated as a whole, but an earlier delete in the same batch
         * invalidates a later edit — and the engine treats an update to a
         * missing clip as a silent no-op, which would be reported as success.
         */
        if (!state.clips[operation.clipId]) {
          failures.push(`${operation.tool || "update"}: clip ${operation.clipId} no longer exists.`);
        } else {
          isolate(operation.tool || "update", () =>
            core.clip.update(operation.clipId, operation.patch)
          );
        }
      } else {
        failures.push(`${operation.tool || operation.op}: the editor cannot apply that operation.`);
      }
    }
    return failures;
  };

  /**
   * Put the scene back exactly as it was before a run.
   *
   * A whole-document import rather than a stack of undos: an agent run is many
   * edits across several rounds, and unwinding them one at a time is both slow
   * and fragile if any of them failed halfway.
   */
  const restoreScene = async (snapshot: any) => {
    if (!snapshot) return;
    try {
      await core.project.import(JSON.parse(JSON.stringify(snapshot)));
      setTurns((prev) => [...prev, { role: "assistant", text: "Put the scene back." }]);
    } catch (cause: any) {
      setTurns((prev) => [
        ...prev,
        { role: "assistant", text: `Could not restore the scene: ${cause?.message || "unknown error"}` },
      ]);
    }
  };

  const send = async (text?: string) => {
    const instruction = String(text ?? draft).trim();
    if (!instruction || busy) return;

    setDraft("");
    setTurns((prev) => [...prev, { role: "user", text: instruction }]);
    setBusy(true);

    /*
     * The scene as it stands, before the agent touches anything.
     *
     * An agent run is many edits across several rounds, so the engine's own
     * history holds dozens of entries and Cmd+Z nudges one of them. That is the
     * difference between "I did not like that" and "it broke my scene and I
     * cannot get it back". One restore point per run makes the whole thing one
     * click to undo, whatever went wrong inside it.
     */
    const before = (() => {
      try {
        return JSON.parse(JSON.stringify(core.project.export()));
      } catch {
        return null;
      }
    })();

    try {
      const plan = getHostCallbacks().planAgentEdit;
      if (!plan) throw new Error("The copilot is not available in this editor.");

      /*
       * The catalogues stay OUT of the execute prompt.
       *
       * Pasting them in costs thousands of tokens every round to name 51
       * effects, 123 presets and 68 transitions, nearly all of which the
       * request never mentions. Instead the model looks things up: it asks for
       * "film", gets `oldFilm` back, and calls add_effect with a name that
       * exists. The one place they ARE pasted in full is the design phase,
       * which runs once — a brief naming presets that do not exist would
       * poison every round after it.
       */
      const vocabulary = {
        effects: EFFECT_OPTIONS().map((option: any) => option.value),
        animations: [...IN_PRESETS(), ...OUT_PRESETS()].map((option: any) => option.value),
        // Separate from entrance/exit on purpose: the two validate different
        // parameters, and merged lists let an emphasis preset pass as an
        // entrance.
        emphasis: EMPHASIS_PRESETS().map((option: any) => option.value),
        transitions: TRANSITION_OPTIONS().map((option: any) => option.value),
        fonts: getGroupedFonts().map((font: any) => font.family),
      };

      /*
       * The scene and the user's own media, as the model sees them. Re-read
       * before every call: the model's own last round moved things. Without
       * the media list the agent answers "add our logo" with a stock search
       * for the word "logo" — which returns somebody else's.
       */
      const described = () => ({
        ...describeDocument(projectStore.getState() as any),
        media: describeMedia(useMediaLibrary.getState().items || []),
      });

      /*
       * Phase 1 — design, for requests that want a video MADE rather than a
       * scene tweaked. A single dispatch loop produces bad videos even when
       * every call is valid, because nobody designed the composition: no
       * palette, no beats, no hierarchy. The brief travels with every round
       * after this, so eight rounds build ONE video instead of eight guesses.
       */
      const kind = classifyRequest(instruction, described());
      const budget = budgetFor(kind);
      let brief = "";

      if (kind === "generate") {
        setPhase("Designing the composition…");
        try {
          const designed: any = await plan(described(), [], instruction, [], {
            phase: "design",
            vocabulary,
          });
          brief = designed?.brief || "";
          if (brief) {
            setTurns((prev) => [
              ...prev,
              { role: "assistant", text: `Plan: ${condenseBrief(brief)}` },
            ]);
          }
        } catch {
          // A failed design phase degrades to the old behaviour — the execute
          // loop still works without a brief, it is just less composed. Not
          // worth failing the whole request over.
        }
      }

      /*
       * Phase 2 — the agent loop: act, LOOK at what happened, decide what is
       * next. Each round is handed the document AS IT NOW IS, plus what the
       * last round actually managed and what it could not — the failures are
       * the important part, because a model that never hears a call failed
       * repeats it every round until the budget runs out.
       *
       * It ends when the model stops asking for anything, when a round
       * achieves nothing, or when the budget runs out.
       */
      setPhase(kind === "generate" ? "Building the scene…" : "Working out what to change…");
      const history: Array<{ role: string; content: string }> = [];
      const failures: string[] = [];
      let totalOperations = 0;
      let message = "";
      let stopped = "";

      for (let round = 0; round < budget.rounds; round += 1) {
        const reply = await plan(described(), toolSchema(), instruction, history, { brief });
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

        const roundFailures = planned.errors.map(
          (error: any) => `${error.name}: ${error.error}`
        );

        const answers = lookups.map((lookup: any) => {
          const found = searchCatalogue(
            vocabulary[lookup.list as keyof typeof vocabulary],
            lookup.query
          );
          const line = `${lookup.list} matching "${lookup.query}" (${found.total} total): ${found.names.join(", ")}`;
          if (lookup.list !== "animations") return line;
          // Emphasis presets ride along on animation lookups, labelled so the
          // model puts them in emphasisPreset rather than in inPreset.
          const looping = searchCatalogue(vocabulary.emphasis, lookup.query, 10);
          return `${line}\nemphasis (looping) presets, for emphasisPreset only: ${looping.names.join(", ")}`;
        });

        const applyFailures = mutations.length ? await applyOperations(mutations) : [];
        roundFailures.push(...applyFailures);
        failures.push(...roundFailures);
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
        if (totalOperations >= budget.operations) {
          stopped = "Stopped after a lot of changes — check the result before asking for more.";
          break;
        }
        if (round === budget.rounds - 1) {
          stopped = "Stopped after several rounds. Ask again to continue.";
        }

        // What it did, what it could not, and where things now stand — the
        // protocol string lives in agent-orchestrator so it can be pinned.
        history.push({ role: "assistant", content: JSON.stringify({ calls: reply.calls }) });
        history.push({
          role: "user",
          content: roundReport({
            answers,
            applied: mutations.length ? summarizeOperations(mutations) : "",
            failures: roundFailures,
            scene: described(),
          }),
        });
      }

      /*
       * Phase 3 — review. The browser runs deterministic checks over the
       * finished scene (dead air, cut-off clips, off-screen text, layering)
       * and the model turns the findings into fix calls. The checks are code,
       * not the model grading itself: a model asked "is your work good?"
       * says yes.
       */
      const findings = critiqueScene(projectStore.getState() as any);
      if (shouldReview({ kind, operations: totalOperations, findings })) {
        setPhase("Reviewing the result…");
        try {
          const reviewed = await plan(described(), toolSchema(), instruction, [], {
            phase: "review",
            brief,
            findings,
          });
          if (reviewed.calls?.length) {
            const planned = planToolCalls(projectStore.getState() as any, reviewed.calls, vocabulary);
            const fixes = planned.operations.filter((op: any) => op.op !== "query");
            for (const error of planned.errors) failures.push(`${error.name}: ${error.error}`);
            if (fixes.length) {
              const fixFailures = await applyOperations(fixes);
              failures.push(...fixFailures);
              totalOperations += fixes.length;
              setTurns((prev) => [
                ...prev,
                { role: "assistant", text: `Review: ${summarizeOperations(fixes)}` },
              ]);
              getHostCallbacks().onClipStyleChange?.(fixes[0]?.clipId || "");
            }
          }
        } catch {
          // Review is a quality pass, not a gate: the edits already landed,
          // and failing the whole request now would report a finished scene
          // as an error.
        }
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
          restore: totalOperations > 0 ? before : undefined,
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
              Describe a change — or a whole video — and the scene is edited for you.
            </p>
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
              Bigger requests get designed first, built step by step, then reviewed against your
              scene. Every edit is checked before it is applied.
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
              {turn.restore ? (
                <button
                  type="button"
                  onClick={() => restoreScene(turn.restore)}
                  title="Put the scene back exactly as it was before this run"
                  className="mt-1.5 rounded border-[2px] border-black bg-muted px-2 py-1 text-[10px] font-black uppercase tracking-widest text-foreground transition-colors hover:bg-accent"
                >
                  Undo this run
                </button>
              ) : null}
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
            {phase}
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
