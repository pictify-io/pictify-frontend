/*
 * Vendored from openvideodev/react-video-editor —
 * src/components/editor/media-panel/index.tsx + tabbar.tsx + store.ts
 * License: OpenVideo License (free tier, accepted 2026-07-27) — see LICENSE at
 * the root of this directory. Local changes: tab set is
 * Text / Media / Stock / Audio / Shapes / Effects / Captions;
 * @remixicon/react replaced by ./icons; shadcn UI replaced by inline markup;
 * the rail toggles the panel drawer open/closed by clicking the active tab
 * again.
 *
 * Tab order follows what a scene is built from, not what was added when:
 * content first (text, your media, stock), then sound, then decoration
 * (shapes, effects), then captions, which are generated from clips that are
 * already there and so can only be the last step.
 */
import * as React from "react";
import { create } from "zustand";
import { cn } from "./ui";
import {
  RiImage2Line,
  RiMusic2Line,
  RiShapesLine,
  RiTBoxLine,
  RiMagicLine,
  RiClosedCaptioningLine,
  RiSearchLine,
  RiSparkling2Line,
} from "./icons";
import PanelText from "./panels/text-panel";
import PanelMedia from "./panels/media-panel";
import PanelAudio from "./panels/audio-panel";
import PanelShapes from "./panels/shapes-panel";
import PanelEffects from "./panels/effects-panel";
import PanelCaptions from "./panels/captions-panel";
import PanelStock from "./panels/stock-panel";
import PanelTranscript from "./panels/transcript-panel";
import PanelCopilot from "./panels/copilot-panel";
import { useCopilotActivity } from "./copilot-activity";

export type Tab = "text" | "media" | "stock" | "audio" | "shapes" | "effects" | "captions" | "transcript" | "copilot";

/*
 * Say it is the FIRST item and the default-open one: describing the change is
 * the primary edit path, and the rail should read top-to-bottom as "tell it
 * what you want, or go get a thing yourself". A rule separates it from the
 * libraries below because it is a different kind of action, not another
 * drawer of assets.
 *
 * It shares the one flyout slot with every library — exactly one panel open at
 * a time. It briefly had a permanently-open column of its own, which was the
 * right instinct and the wrong trade: it cost ~264px of stage on every screen,
 * including all the time the user was cutting clips and not talking to it.
 */
const tabs: { key: Tab; label: string; icon: React.ComponentType<any> }[] = [
  { key: "copilot", label: "Say it", icon: RiSparkling2Line },
  { key: "text", label: "Text", icon: RiTBoxLine },
  { key: "media", label: "Media", icon: RiImage2Line },
  { key: "stock", label: "Stock", icon: RiSearchLine },
  { key: "audio", label: "Audio", icon: RiMusic2Line },
  { key: "shapes", label: "Shapes", icon: RiShapesLine },
  { key: "effects", label: "Effects", icon: RiMagicLine },
  { key: "captions", label: "Captions", icon: RiClosedCaptioningLine },
  { key: "transcript", label: "Transcript", icon: RiTBoxLine },
];

interface ToolPanelStore {
  activeTab: Tab;
  isOpen: boolean;
  setActiveTab: (tab: Tab) => void;
  toggle: (tab: Tab) => void;
}

export const useToolPanelStore = create<ToolPanelStore>((set, get) => ({
  activeTab: "copilot",
  isOpen: true,
  setActiveTab: (tab) => set({ activeTab: tab, isOpen: true }),
  toggle: (tab) => {
    const { activeTab, isOpen } = get();
    if (activeTab === tab && isOpen) set({ isOpen: false });
    else set({ activeTab: tab, isOpen: true });
  },
}));

const PANEL_COMPONENTS: Record<Tab, React.ComponentType> = {
  text: PanelText,
  media: PanelMedia,
  stock: PanelStock,
  audio: PanelAudio,
  shapes: PanelShapes,
  effects: PanelEffects,
  captions: PanelCaptions,
  transcript: PanelTranscript,
  copilot: PanelCopilot,
};

export default function ToolRail() {
  const { activeTab, isOpen, toggle } = useToolPanelStore();
  const copilotBusy = useCopilotActivity((s) => s.busy);
  // Copilot is rendered separately below and kept mounted, so it is excluded
  // from the generic slot rather than looked up here.
  const ActivePanel = activeTab === "copilot" ? null : PANEL_COMPONENTS[activeTab];

  return (
    <div className="flex h-full bg-background text-foreground">
      {/* Vertical tab rail */}
      {/* w-16, not w-14: the rail is its own 64px card in the Pictify shell, and
          56px clipped the "Transcript" label. Matches the host card exactly so
          there is no seam between the card edge and the rail's own background. */}
      <div className="flex h-full w-16 shrink-0 flex-col items-center gap-1 border-r border-border bg-popover py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key && isOpen;
          const isCopilot = tab.key === "copilot";
          return (
            <React.Fragment key={tab.key}>
            <button
              onClick={() => toggle(tab.key)}
              className={cn(
                "relative",
                // Say it wears ink when active, not the field green the
                // libraries use: it is the one item that is a different kind of
                // action, and the rule below it is only half the separation.
                isCopilot && isActive && "bg-foreground text-background hover:bg-foreground",
                // w-full, not w-12: the longest label ("Transcript") is wider
                // than 48px and was being clipped to "RANSCRIPT" at both ends.
                // Active is primary/primary-foreground (field on ink) — the old
                // accent/primary pair became pale-green-on-near-white once the
                // semantic tokens were re-pointed to the Repro Shop palette.
                "flex w-full flex-col items-center gap-0.5 rounded py-2 transition-colors",
                isActive && !isCopilot && "bg-primary text-primary-foreground",
                !isActive && "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
              title={tab.label}
            >
              <Icon size={18} />
              <span className="w-full text-center text-[9px] font-bold uppercase leading-none">
                {tab.label}
              </span>
              {/* Progress, while you are looking somewhere else. It never pulls
                  focus back — finishing a thought in another panel matters more
                  than watching this one work. */}
              {isCopilot && copilotBusy && !isActive && (
                <span
                  className="absolute right-1.5 top-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-brand-pink"
                  aria-hidden="true"
                />
              )}
              {isCopilot && copilotBusy && (
                <span className="sr-only">Working</span>
              )}
            </button>
            {isCopilot && <div className="my-1 h-px w-8 shrink-0 bg-border" />}
            </React.Fragment>
          );
        })}
      </div>

      {/* Panel drawer — one slot, one panel at a time. */}
      {isOpen && (
        <div className="h-full w-64 shrink-0 border-r border-border bg-background">
          {/*
            Copilot stays mounted and is hidden with CSS rather than swapped
            out. Its conversation, its draft and its in-flight request all live
            in component state, so unmounting on a tab switch would throw away
            a run the user is waiting on — which is exactly when they are most
            likely to go look at something else.
          */}
          <div className="h-full" hidden={activeTab !== "copilot"}>
            <PanelCopilot />
          </div>
          {ActivePanel && <ActivePanel />}
        </div>
      )}
    </div>
  );
}
