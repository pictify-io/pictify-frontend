/*
 * Vendored from openvideodev/react-video-editor — src/components/editor/timeline/items/preview-drag-item.ts
 * License: OpenVideo License (free tier, accepted 2026-07-27) — see LICENSE at
 * the root of this directory. Local changes: import paths rebased onto this
 * vendor directory.
 */
import {
  PreviewTrackItem as PreviewTrackItemBase,
  PreviewTrackItemProps,
} from "@openvideo/timeline";

class PreviewTrackItem extends PreviewTrackItemBase {
  static type = "PreviewTrackItem";
  constructor(props: PreviewTrackItemProps) {
    super(props);
  }
}

export default PreviewTrackItem;
