// PSEO Utility Functions

export function parseSize(sizeStr) {
	const match = (sizeStr || '').toLowerCase().match(/^(\d+)x(\d+)$/);
	if (!match) return { width: null, height: null };
	return { width: parseInt(match[1], 10), height: parseInt(match[2], 10) };
}

export function sizeUrl(format, size) {
	return `/tools/html-to-${format}/${size}`;
}

export function baseFormatUrl(format) {
	return `/tools/html-to-${format}`;
}
