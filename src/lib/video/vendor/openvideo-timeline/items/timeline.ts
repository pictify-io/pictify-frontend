/*
 * Vendored from openvideodev/react-video-editor — src/components/editor/timeline/items/timeline.ts
 * License: OpenVideo License (free tier, accepted 2026-07-27) — see LICENSE at
 * the root of this directory. Local changes: import paths rebased onto this
 * vendor directory; lodash throttle replaced by a local implementation.
 */
import TimelineBase from "@openvideo/timeline";
import Video from "./video";
import Audio from "./audio";

// Local stand-in for lodash's throttle (trailing-edge) so the vendored code
// does not pull the full lodash package into this repo.
const throttle = <T extends (...args: any[]) => void>(fn: T, wait: number): T => {
  let last = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  return ((...args: any[]) => {
    const now = Date.now();
    const remaining = wait - (now - last);
    if (remaining <= 0) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      last = now;
      fn(...args);
    } else if (!timer) {
      timer = setTimeout(() => {
        last = Date.now();
        timer = null;
        fn(...args);
      }, remaining);
    }
  }) as T;
};
import { TimelineOptions } from "@openvideo/timeline";
import { ITimelineScaleState } from "@openvideo/timeline";

class Timeline extends TimelineBase {
  public isShiftKey: boolean = false;

  constructor(
    canvasEl: HTMLCanvasElement,
    options: Partial<TimelineOptions> & {
      scale: ITimelineScaleState;
      duration: number;
      guideLineColor?: string;
    },
  ) {
    super(canvasEl, options); // Call the parent class constructor

    // Add shift keyboard listener
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Shift") {
      this.isShiftKey = true;
    }
  };

  private handleKeyUp = (event: KeyboardEvent) => {
    if (event.key === "Shift") {
      this.isShiftKey = false;
    }
  };

  public purge(): void {
    super.purge();

    // Cleanup event listener for Shift key
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
  }

  public setViewportPos(posX: number, posY: number) {
    const limitedPos = this.getViewportPos(posX, posY);
    const vt = this.viewportTransform;
    vt[4] = limitedPos.x;
    vt[5] = limitedPos.y;
    this.requestRenderAll();
    this.setActiveTrackItemCoords();
    this.onScrollChange();

    this.onScroll?.({
      scrollTop: limitedPos.y,
      scrollLeft: limitedPos.x - this.spacing.left,
    });
  }

  public onScrollChange = throttle(async () => {
    const objects = this.getObjects();
    const viewportTransform = this.viewportTransform;
    const scrollLeft = viewportTransform[4];
    for (const object of objects) {
      if (object instanceof Video || object instanceof Audio) {
        object.onScrollChange({ scrollLeft });
      }
    }
  }, 250);

  public scrollTo({ scrollLeft, scrollTop }: { scrollLeft?: number; scrollTop?: number }): void {
    const vt = this.viewportTransform; // Create a shallow copy
    let hasChanged = false;

    if (typeof scrollLeft === "number") {
      vt[4] = -scrollLeft + this.spacing.left;
      hasChanged = true;
    }
    if (typeof scrollTop === "number") {
      vt[5] = -scrollTop;
      hasChanged = true;
    }

    if (hasChanged) {
      this.viewportTransform = vt;
      this.getActiveObject()?.setCoords();
      this.onScrollChange();
      this.requestRenderAll();
    }
  }
}

export default Timeline;
