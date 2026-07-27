/*
 * Vendored from openvideodev/react-video-editor — the useClipActions hook
 * extracted from src/components/editor/studio-context-menu.tsx (the radix
 * dropdown component around it was not vendored; only the timeline header
 * consumes this hook here).
 * License: OpenVideo License (free tier, accepted 2026-07-27) — see LICENSE at
 * the root of this directory. Local changes: import paths rebased; hook logic
 * verbatim.
 */
import * as React from "react";
import { useCallback } from "react";
import { useStore } from "zustand";
import { core, projectStore } from "./runtime";
import { nanoid, AnyClip } from "@openvideo/core";

// Module-level clipboard — persists across renders
export let clipboardClipJSON: AnyClip | null = null;

export function useClipActions(clipOverride?: any) {
  const selectedIds = useStore(projectStore, (s) => s.selectedIds);
  const primaryId = clipOverride?.id || selectedIds[0];
  const selectedClip = useStore(projectStore, (s) => s.clips[primaryId]);

  const [hasClipboard, setHasClipboard] = React.useState(clipboardClipJSON !== null);

  const isLocked = selectedClip?.locked ?? false;

  // Sync clipboard state
  React.useEffect(() => {
    const interval = setInterval(() => {
      setHasClipboard(clipboardClipJSON !== null);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = useCallback(() => {
    if (!selectedClip) return;
    clipboardClipJSON = JSON.parse(JSON.stringify(selectedClip));
    setHasClipboard(true);
  }, [selectedClip]);

  const handlePaste = useCallback(async () => {
    if (!clipboardClipJSON) return;

    const newId = nanoid();
    const currentTime = core.store.getState().currentTime;

    const newClip = {
      ...clipboardClipJSON,
      id: newId,
      timing: {
        ...clipboardClipJSON.timing,
        display: {
          ...clipboardClipJSON.timing.display,
          from: currentTime,
          to: currentTime + clipboardClipJSON.timing.duration,
        },
      },
    };

    await core.clip.add(newClip as any);
  }, []);

  const handleDuplicate = useCallback(async () => {
    const ids = clipOverride ? [clipOverride.id] : selectedIds;
    if (ids.length === 0) return;
    core.clip.duplicate(ids);
  }, [selectedIds, clipOverride]);

  const handleToggleLock = useCallback(async () => {
    if (!selectedClip) return;
    core.clip.update(selectedClip.id, { locked: !isLocked });
  }, [selectedClip, isLocked]);

  const handleDelete = useCallback(async () => {
    const ids = clipOverride ? [clipOverride.id] : selectedIds;
    if (ids.length === 0) return;
    core.clip.remove(ids);
  }, [selectedIds, clipOverride]);

  return {
    selectedClip,
    isLocked,
    hasClipboard,
    handleCopy,
    handlePaste,
    handleDuplicate,
    handleToggleLock,
    handleDelete,
  };
}
