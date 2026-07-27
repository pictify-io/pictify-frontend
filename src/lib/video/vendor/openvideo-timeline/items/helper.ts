/*
 * Vendored from openvideodev/react-video-editor — src/components/editor/timeline/items/helper.ts
 * License: OpenVideo License (free tier, accepted 2026-07-27) — see LICENSE at
 * the root of this directory. Local changes: import paths rebased onto this
 * vendor directory.
 */
import { Helper as HelperBase, HelperProps } from "@openvideo/timeline";

class Helper extends HelperBase {
  static type = "Helper";

  constructor(props: HelperProps) {
    props.activeGuideFill = "#ffffff";
    super(props);
  }
}

export default Helper;
