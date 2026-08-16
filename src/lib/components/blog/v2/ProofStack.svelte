<script>
	/**
	 * Three fanned output cards: a PDF, a PNG and an MP4 off one template.
	 *
	 * The closing band's whole claim is "every guide ends in a working
	 * template", and this is that claim as a picture: one source, three
	 * different files. Flat vector on purpose — a screenshot of real output
	 * would date the moment the UI changes, and this has to survive the next
	 * three redesigns.
	 *
	 * Decorative. The band states the same thing in words directly beside it.
	 */
	let className = '';
	export { className as class };
</script>

<svg
	class={className}
	viewBox="0 0 240 180"
	fill="none"
	xmlns="http://www.w3.org/2000/svg"
	aria-hidden="true"
>
	<!-- Back card: PDF, rose -->
	<g transform="rotate(-9 62 96)">
		<rect x="14" y="42" width="96" height="120" rx="8" fill="#FFD3E8" stroke="#000" stroke-width="1.5" />
		<rect x="26" y="56" width="42" height="9" rx="2" fill="#000" fill-opacity="0.55" />
		<rect x="26" y="72" width="66" height="5" rx="2" fill="#000" fill-opacity="0.22" />
		<rect x="26" y="83" width="58" height="5" rx="2" fill="#000" fill-opacity="0.22" />
		<rect x="26" y="94" width="64" height="5" rx="2" fill="#000" fill-opacity="0.22" />
		<rect x="26" y="132" width="34" height="16" rx="4" fill="#fff" stroke="#000" stroke-width="1.2" />
		<text x="43" y="143" font-family="JetBrains Mono, monospace" font-size="8" text-anchor="middle" fill="#000">PDF</text>
	</g>

	<!-- Middle card: PNG on white, with a blue image plate -->
	<g transform="rotate(-1 120 92)">
		<rect x="72" y="30" width="96" height="120" rx="8" fill="#fff" stroke="#000" stroke-width="1.5" />
		<rect x="84" y="44" width="72" height="46" rx="4" fill="#A9D7F2" stroke="#000" stroke-width="1.2" />
		<circle cx="102" cy="60" r="6" fill="#0078BF" />
		<path d="M88 86l16-18 12 13 9-8 27 13v10H88z" fill="#0078BF" fill-opacity="0.55" />
		<rect x="84" y="100" width="52" height="5" rx="2" fill="#000" fill-opacity="0.22" />
		<rect x="84" y="111" width="40" height="5" rx="2" fill="#000" fill-opacity="0.22" />
		<rect x="84" y="128" width="36" height="16" rx="4" fill="#fff" stroke="#000" stroke-width="1.2" />
		<text x="102" y="139" font-family="JetBrains Mono, monospace" font-size="8" text-anchor="middle" fill="#000">PNG</text>
	</g>

	<!-- Front card: MP4, press dark, lime play -->
	<g transform="rotate(8 178 100)">
		<rect x="130" y="46" width="96" height="120" rx="8" fill="#242628" stroke="#000" stroke-width="1.5" />
		<circle cx="178" cy="94" r="22" fill="#D8F34A" />
		<path d="M172 84l16 10-16 10z" fill="#000" />
		<rect x="142" y="128" width="60" height="4" rx="2" fill="#fff" fill-opacity="0.18" />
		<rect x="142" y="128" width="26" height="4" rx="2" fill="#D8F34A" />
		<rect x="142" y="142" width="36" height="16" rx="4" fill="#131417" stroke="#fff" stroke-opacity="0.25" stroke-width="1.2" />
		<text x="160" y="153" font-family="JetBrains Mono, monospace" font-size="8" text-anchor="middle" fill="#ADB9C6">MP4</text>
	</g>
</svg>
