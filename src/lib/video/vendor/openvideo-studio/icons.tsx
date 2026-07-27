/*
 * Icon components written for Pictify to replace the upstream app's
 * `@remixicon/react` dependency in the studio panels. SVG path data is from
 * Remix Icon (https://remixicon.com, Apache License 2.0), same glyphs the
 * upstream app uses; the tiny component wrapper mirrors @remixicon/react's
 * props. Icons already vendored for the timeline island are re-exported from
 * there instead of duplicating path data.
 */
import * as React from "react";

export {
  RiDeleteBinLine,
  RiFileCopyLine,
  RiAddLine,
  RiSubtractLine,
} from "../openvideo-timeline/icons";

type IconProps = React.SVGAttributes<SVGSVGElement> & { size?: number | string };

const makeIcon = (d: string) => {
  const Icon = ({ size = 24, className, ...props }: IconProps) => (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d={d} />
    </svg>
  );
  return Icon;
};

/** Text panel (Ri T-Box) */
export const RiTBoxLine = makeIcon(
  "M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm1 2v14h14V5H5Zm8 3v9h-2V8H8V6h8v2h-3Z"
);

/** Media panel (Ri Image 2) */
export const RiImage2Line = makeIcon(
  "M20 5H4v14l9.292-9.294a1 1 0 0 1 1.414 0L20 15.01V5ZM2 3.993A1 1 0 0 1 2.992 3h18.016c.548 0 .992.445.992.993v16.014a1 1 0 0 1-.992.993H2.992A.993.993 0 0 1 2 20.007V3.993ZM8 11a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z"
);

/** Audio panel (Ri Music 2) */
export const RiMusic2Line = makeIcon(
  "M20 3v14a4 4 0 1 1-2-3.465V5H9v12a4 4 0 1 1-2-3.465V3h13ZM5 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm11 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
);

/** Shapes panel (Ri Shapes) */
export const RiShapesLine = makeIcon(
  "M7.784 14 3.076 5.562A1 1 0 0 1 3.949 4.075h9.102a1 1 0 0 1 .873 1.487L9.216 14H7.784ZM8.5 12.03 11.35 6.925H5.65L8.5 12.03ZM17.5 13a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Zm0 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM3 21.5v-6h6v6H3Zm2-4v2h2v-2H5Z"
);

/** Upload */
export const RiUploadCloud2Line = makeIcon(
  "M12 12.586 16.243 16.83l-1.415 1.414L13 16.416V22h-2v-5.587l-1.828 1.83-1.415-1.415L12 12.586ZM12 2a7.001 7.001 0 0 1 6.954 6.194 5.5 5.5 0 0 1-.953 10.784v-2.014a3.5 3.5 0 1 0-1.112-6.91 5 5 0 1 0-9.777 0 3.5 3.5 0 0 0-1.292 6.88l.18.03v2.014a5.5 5.5 0 0 1-.954-10.784A7 7 0 0 1 12 2Z"
);

/** Video clip */
export const RiVideoLine = makeIcon(
  "M3 3.993C3 3.445 3.445 3 3.993 3h16.014c.548 0 .993.445.993.993v16.014a.994.994 0 0 1-.993.993H3.993A.994.994 0 0 1 3 20.007V3.993ZM5 5v14h14V5H5Zm5.622 3.415 4.879 3.252a.4.4 0 0 1 0 .666l-4.88 3.252a.4.4 0 0 1-.621-.332V8.747a.4.4 0 0 1 .622-.332Z"
);

/** Align left */
export const RiAlignLeft = makeIcon("M3 4h18v2H3V4Zm0 15h14v2H3v-2Zm0-5h18v2H3v-2Zm0-5h14v2H3V9Z");

/** Align center */
export const RiAlignCenter = makeIcon("M3 4h18v2H3V4Zm2 15h14v2H5v-2Zm-2-5h18v2H3v-2Zm2-5h14v2H5V9Z");

/** Align right */
export const RiAlignRight = makeIcon("M3 4h18v2H3V4Zm4 15h14v2H7v-2Zm-4-5h18v2H3v-2Zm4-5h14v2H7V9Z");

/** Loader */
export const RiLoader5Line = makeIcon(
  "M12 3a9 9 0 0 1 9 9h-2a7 7 0 0 0-7-7V3Z"
);

/** Close */
export const RiCloseLine = makeIcon(
  "m12 10.586 4.95-4.95 1.414 1.415-4.95 4.949 4.95 4.95-1.415 1.414-4.949-4.95-4.95 4.95-1.414-1.415 4.95-4.949-4.95-4.95L7.05 5.638l4.95 4.95Z"
);
