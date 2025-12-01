/**
 * Generates an SVG path data string for a rectangle with individual corner radii.
 * 
 * @param {number} width - The width of the rectangle
 * @param {number} height - The height of the rectangle
 * @param {Object} radii - Object containing corner radii { tl, tr, br, bl }
 * @returns {string} The SVG path data string
 */
export function getRoundedRectPath(width, height, radii) {
    const { tl = 0, tr = 0, br = 0, bl = 0 } = radii;
    
    // Ensure radii don't exceed dimensions
    const maxRadius = Math.min(width, height) / 2;
    const clampedRadii = {
        tl: Math.min(tl, maxRadius),
        tr: Math.min(tr, maxRadius),
        br: Math.min(br, maxRadius),
        bl: Math.min(bl, maxRadius)
    };

    // Starting point (top-left, after corner)
    let path = `M ${clampedRadii.tl} 0`;

    // Top edge
    path += ` L ${width - clampedRadii.tr} 0`;
    
    // Top-right corner
    if (clampedRadii.tr > 0) {
        path += ` Q ${width} 0 ${width} ${clampedRadii.tr}`;
    } else {
        path += ` L ${width} 0`;
    }

    // Right edge
    path += ` L ${width} ${height - clampedRadii.br}`;

    // Bottom-right corner
    if (clampedRadii.br > 0) {
        path += ` Q ${width} ${height} ${width - clampedRadii.br} ${height}`;
    } else {
        path += ` L ${width} ${height}`;
    }

    // Bottom edge
    path += ` L ${clampedRadii.bl} ${height}`;

    // Bottom-left corner
    if (clampedRadii.bl > 0) {
        path += ` Q 0 ${height} 0 ${height - clampedRadii.bl}`;
    } else {
        path += ` L 0 ${height}`;
    }

    // Left edge
    path += ` L 0 ${clampedRadii.tl}`;

    // Top-left corner
    if (clampedRadii.tl > 0) {
        path += ` Q 0 0 ${clampedRadii.tl} 0`;
    } else {
        path += ` L 0 0`;
    }

    path += ' Z';
    
    return path;
}
