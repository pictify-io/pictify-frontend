/*
 * Vendored from openvideodev/react-video-editor — src/components/editor/timeline/items/transition.ts
 * License: OpenVideo License (free tier, accepted 2026-07-27) — see LICENSE at
 * the root of this directory. Local changes: import paths rebased onto this
 * vendor directory.
 */
import { Transition as BaseTransition, Control } from "@openvideo/timeline";
import { createTransitionControls } from "../controls";

class Transition extends BaseTransition {
  static type = "Transition";

  static createControls(): { controls: Record<string, Control> } {
    return { controls: createTransitionControls() };
  }

  constructor(props: any) {
    // Now using standardized fromClipId, toClipId, and key
    super(props);
  }

  // Override sync to handle updates from state
  public sync(clipData: any) {
    this.fromClipId = clipData.fromClipId;
    this.toClipId = clipData.toClipId;
    this.key = clipData.transitionKey || clipData.key || "none";
    this.duration = clipData.duration;

    this.set({
      display: clipData.display,
      duration: clipData.duration,
    });
  }
}

export default Transition;
