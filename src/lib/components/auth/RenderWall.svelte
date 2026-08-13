<script>
	/**
	 * Login panel: the proof wall after hours.
	 *
	 * A tilted plane of render tiles bleeding off all four edges — most dormant,
	 * a handful in brand colours, one still working. Signup shows the machine and
	 * what it makes; this shows the queue still running. Two different jobs, so
	 * two different graphics rather than one recoloured twice.
	 *
	 * Built from coded tiles, not artwork: the generated scenes carry white
	 * grounds, which on a black panel read as a pasted rectangle.
	 */

	/**
	 * Every tile is distinct. A duplicated row reads instantly as copy-paste —
	 * the same four labels marching down the wall — which turns a queue into a
	 * wallpaper pattern.
	 */
	const rows = [
		[
			['Invoice 0412', '£1,248'], ['Social card', 'Ship faster'], ['Ticket', 'GA · 04B'],
			['Listing', '2 bed · SE15'], ['Badge', 'Rafael Nunes'], ['Recap film', 'Priya Raman']
		],
		[
			['Rendering', 'row 4,991'], ['Milestone', '300 days'], ['Weekly report', '+18.4%'],
			['Profile card', 'Mei-Ling C.'], ['Receipt', '£29.00'], ['OG image', 'Render time 4×']
		],
		[
			['Statement', '£4,182'], ['Recap film', 'Priya Raman'], ['Certificate', 'Tom Okafor'],
			['Price card', '£1,190'], ['Invoice 0413', '£980'], ['Badge', 'Hall B · 14:30']
		],
		[
			['Ticket', 'GA · 11C'], ['Listing', '1 bed · E8'], ['Statement', '£2,904'],
			['Social card', 'Ship faster'], ['Certificate', 'Ana Duarte'], ['Milestone', '1,000 days']
		],
		[
			['Receipt', '£74.20'], ['OG image', 'Six ways in'], ['Recap film', 'Jonas Vik'],
			['Profile card', 'Sana Iqbal'], ['Weekly report', '+6.2%'], ['Price card', '£312']
		],
		[
			['Badge', 'Iris Bell'], ['Milestone', '90 days'], ['Statement', '£618'],
			['Price card', '£89'], ['Invoice 0414', '£2,100'], ['Listing', 'Studio · N1']
		]
	];

	// Sparse accents keyed by "row,col" so the colour never falls into a stripe.
	const accents = {
		'0,1': 'bg-brand-blue text-white',
		'0,3': 'bg-brand-sky text-brand-ink',
		'1,3': 'bg-brand-sky text-brand-ink',
		'2,1': 'bg-brand-field text-brand-ink',
		'2,3': 'bg-brand-sky text-brand-ink',
		'3,3': 'bg-brand-blue text-white',
		'4,3': 'bg-brand-rose text-brand-ink',
		'5,1': 'bg-brand-blue text-white'
	};

	// The one tile that has not finished — the whole point of the panel.
	const working = '1,0';

	// Alternating indents give the plane a masonry stagger under the rotation.
	const indents = ['pl-0', 'pl-[94px]', 'pl-[44px]', 'pl-[94px]', 'pl-[44px]', 'pl-0'];
</script>

<div class="relative h-full w-full overflow-hidden bg-brand-ink">
	<!-- The wall. Oversized and rotated so it is cut on every edge. -->
	<div
		class="absolute -left-[186px] -top-[116px] flex w-[1240px] flex-col gap-4 -rotate-[9deg]"
		aria-hidden="true"
	>
		{#each rows as row, r (r)}
			<div class="flex gap-4 {indents[r]}">
				{#each row as [label, title], c (c)}
					{@const key = `${r},${c}`}
					{@const accent = accents[key]}
					<div
						class="flex h-[118px] w-[184px] flex-shrink-0 flex-col justify-end rounded-tile p-[13px] {key ===
						working
							? 'border-2 border-dashed border-brand-field'
							: accent || 'bg-[#17191C]'}"
					>
						<span
							class="font-mono text-[8px] uppercase tracking-[0.14em] {key === working
								? 'text-brand-field'
								: accent
									? 'opacity-60'
									: 'text-[#5C6169]'}"
						>
							{label}
						</span>
						<span
							class="font-display text-[19px] font-bold tracking-[-0.02em] {key === working
								? 'text-brand-field'
								: accent
									? ''
									: 'text-[#8D949E]'}"
						>
							{title}
						</span>
					</div>
				{/each}
			</div>
		{/each}
	</div>

	<!-- Keeps the headline legible where it crosses the wall. -->
	<div
		class="absolute inset-x-0 bottom-0 h-[300px] bg-gradient-to-b from-transparent via-black/[0.86] to-black"
		aria-hidden="true"
	></div>

	<div class="absolute bottom-14 left-16 flex w-[440px] flex-col gap-2">
		<span class="font-mono text-[11px] uppercase tracking-[0.1em] text-brand-field">
			Since you were last here
		</span>
		<p class="font-display text-[30px] font-extrabold leading-8 tracking-[-0.03em] text-white">
			The queue kept running.
		</p>
	</div>

	<!--
		Bleed sits lower-right rather than top: the wall is densest and most
		colourful along the top edge, so decorations up there competed with it.
		Down here the scrim has gone quiet and they have something to read against.
	-->
	<svg
		class="pointer-events-none absolute -bottom-[38px] -right-[42px]"
		width="176"
		height="176"
		viewBox="0 0 176 176"
		fill="none"
		aria-hidden="true"
	>
		<rect x="88" y="0" width="44" height="44" fill="#0078BF" />
		<rect x="44" y="44" width="44" height="44" fill="#D8F34A" />
		<rect x="88" y="44" width="44" height="44" fill="#FFFFFF" />
		<rect x="0" y="88" width="44" height="44" fill="#0078BF" />
		<rect x="88" y="88" width="44" height="44" fill="#A9D7F2" />
		<rect x="44" y="132" width="44" height="44" fill="#0078BF" />
	</svg>
	<div
		class="pointer-events-none absolute -right-[74px] bottom-[206px] h-[50px] w-[220px] -rotate-[30deg] rounded-full bg-brand-field"
		aria-hidden="true"
	></div>
</div>
