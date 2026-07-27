/*
 * Vendored from openvideodev/react-video-editor —
 * src/components/editor/media-panel/index.tsx + tabbar.tsx + store.ts
 * License: OpenVideo License (free tier, accepted 2026-07-27) — see LICENSE at
 * the root of this directory. Local changes: tab set reduced to
 * Text / Media / Audio / Shapes; @remixicon/react replaced by ./icons;
 * shadcn UI replaced by inline markup; the rail toggles the panel drawer
 * open/closed by clicking the active tab again.
 */
import { create } from "zustand";
import { cn } from "./ui";
import { RiImage2Line, RiMusic2Line, RiShapesLine, RiTBoxLine } from "./icons";
import PanelText from "./panels/text-panel";
import PanelMedia from "./panels/media-panel";
import PanelAudio from "./panels/audio-panel";
import PanelShapes from "./panels/shapes-panel";

export type Tab = "text" | "media" | "audio" | "shapes";

const tabs: { key: Tab; label: string; icon: React.ComponentType<any> }[] = [
  { key: "text", label: "Text", icon: RiTBoxLine },
  { key: "media", label: "Media", icon: RiImage2Line },
  { key: "audio", label: "Audio", icon: RiMusic2Line },
  { key: "shapes", label: "Shapes", icon: RiShapesLine },
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
  audio: PanelAudio,
  shapes: PanelShapes,
};

export default function ToolRail() {
  const { activeTab, isOpen, toggle } = useToolPanelStore();
  const ActivePanel = PANEL_COMPONENTS[activeTab];

  return (
    <div className="flex h-full bg-background text-foreground">
      {/* Vertical tab rail */}
      <div className="flex h-full w-14 shrink-0 flex-col items-center gap-1 border-r border-border bg-popover py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key && isOpen;
          return (
            <button
              key={tab.key}
              onClick={() => toggle(tab.key)}
              className={cn(
                "flex w-12 flex-col items-center gap-0.5 rounded py-2 transition-colors",
                isActive
                  ? "bg-accent text-primary"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              )}
              title={tab.label}
            >
              <Icon size={18} />
              <span className="text-[9px] font-bold uppercase tracking-wide">{tab.label}</span>
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
