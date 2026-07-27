/*
 * Vendored from openvideodev/react-video-editor — merged from
 * src/components/editor/hooks/use-timeline-offset.ts and
 * src/hooks/use-mobile.ts.
 * License: OpenVideo License (free tier, accepted 2026-07-27) — see LICENSE at
 * the root of this directory. Local changes: two tiny hooks merged into one
 * module; logic verbatim.
 */
import * as React from "react";
import { TIMELINE_OFFSET_X_SMALL, TIMELINE_OFFSET_X_LARGE } from "./constants";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}

export function useTimelineOffsetX(): number {
  const isMobile = useIsMobile();
  return isMobile ? TIMELINE_OFFSET_X_SMALL : TIMELINE_OFFSET_X_LARGE;
}
