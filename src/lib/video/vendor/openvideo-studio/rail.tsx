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

export type Tab = "text" | "media" | "stock" | "audio" | "shapes" | "effects" | "captions" | "transcript" | "copilot";

const tabs: { key: Tab; label: string; icon: React.ComponentType<any> }[] = [
  // Copilot is NOT here: v2 gives it its own always-open column to the left of
  // this rail (studioHost.mountCopilotPanel), because describing the change is
  // the primary edit path and a primary path should not be behind a tab. The
  // 'copilot' Tab type and PANEL_COMPONENTS entry stay so the store's existing
  // states remain valid.
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
  activeTab: "text",
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
  const ActivePanel = PANEL_COMPONENTS[activeTab];

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
          return (
            <button
              key={tab.key}
              onClick={() => toggle(tab.key)}
              className={cn(
                // w-full, not w-12: the longest label ("Transcript") is wider
                // than 48px and was being clipped to "RANSCRIPT" at both ends.
                // Active is primary/primary-foreground (field on ink) — the old
                // accent/primary pair became pale-green-on-near-white once the
                // semantic tokens were re-pointed to the Repro Shop palette.
                "flex w-full flex-col items-center gap-0.5 rounded py-2 transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
              title={tab.label}
            >
              <Icon size={18} />
              <span className="w-full text-center text-[9px] font-bold uppercase leading-none">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Panel drawer */}
      {isOpen && (
        <div className="h-full w-64 shrink-0 border-r border-border bg-background">
          <ActivePanel />
        </div>
      )}
    </div>
  );
}
