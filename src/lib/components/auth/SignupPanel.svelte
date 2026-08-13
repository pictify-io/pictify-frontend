<script>
	/**
	 * Signup panel: the machine, and the artifacts it just made.
	 *
	 * The mascot scenes carry white grounds, so rather than fight that they are
	 * treated as deliberate render tiles — bordered and tilted. Dropped raw onto
	 * the lime they read as a pasted rectangle instead of a bleed.
	 */

	/** Echoes back into the certificate tile, so the page fills its own variable. */
	export let email = '';

	$: shown = email.trim() || 'you@yourcompany.com';
</script>

<div class="relative h-full w-full overflow-hidden bg-brand-field pl-16 pt-16">
	<div class="flex w-[520px] flex-col gap-3">
		<span class="font-mono text-[11px] uppercase tracking-[0.1em] text-black/55">
			What lands in your account
		</span>
		<p class="font-display text-[38px] font-extrabold leading-[38px] tracking-[-0.035em] text-brand-ink">
			One template. Every file it can make.
		</p>
	</div>

	<!-- Decoration first so every render artifact stacks above it. -->
	<svg
		class="pointer-events-none absolute -right-[52px] -top-12"
		width="176"
		height="132"
		viewBox="0 0 240 180"
		fill="none"
		aria-hidden="true"
	>
		<rect x="120" y="0" width="60" height="60" fill="#0078BF" />
		<rect x="60" y="60" width="60" height="60" fill="#000000" />
		<rect x="120" y="60" width="60" height="60" fill="#FFD3E8" />
		<rect x="180" y="0" width="60" height="60" fill="#A9D7F2" />
		<rect x="0" y="120" width="60" height="60" fill="#0078BF" />
		<rect x="120" y="120" width="60" height="60" fill="#0078BF" />
		<rect x="180" y="120" width="60" height="60" fill="#000000" />
	</svg>
	<div
		class="pointer-events-none absolute -left-[84px] top-[534px] h-12 w-[210px] -rotate-[32deg] rounded-full bg-brand-blue"
		aria-hidden="true"
	></div>

	<!--
		The signature move: the address being typed on the left appears here as the
		filled variable. The page demonstrates its own claim — a template declares
		a variable, something fills it — rather than asserting it in copy.
	-->
	<div
		class="absolute left-16 top-[286px] flex w-[296px] flex-col gap-3.5 rounded-tile border-2 border-brand-ink bg-white p-5 -rotate-2"
		aria-hidden="true"
	>
		<span class="font-mono text-[10px] uppercase tracking-[0.12em] text-brand-mute">
			Certificate · row 001
		</span>
		<div class="flex flex-col gap-[5px]">
			<span class="font-mono text-xs text-brand-royal">&#123;&#123;email&#125;&#125;</span>
			<span class="truncate font-display text-[22px] font-bold tracking-[-0.03em] text-brand-ink">
				{shown}
			</span>
		</div>
		<span class="h-[3px] w-11 bg-brand-royal"></span>
	</div>

	<div
		class="absolute left-[306px] top-48 flex h-[132px] w-[186px] flex-col justify-between rounded-tile bg-brand-plum p-4 rotate-[4deg]"
		aria-hidden="true"
	>
		<span class="font-mono text-[9px] uppercase tracking-[0.12em] text-brand-field">Invoice 0412</span>
		<div class="flex flex-col gap-0.5">
			<span class="font-display text-[26px] font-bold tracking-[-0.03em] text-white">£1,248</span>
			<span class="font-sans text-[11px] text-white/60">PDF · 1.2s</span>
		</div>
	</div>

	<div
		class="absolute -left-[18px] top-[470px] flex h-[150px] w-[250px] flex-col justify-between rounded-tile border-2 border-brand-ink bg-brand-sky p-[18px] rotate-[5deg]"
		aria-hidden="true"
	>
		<span class="font-mono text-[9px] uppercase tracking-[0.12em] text-black/55">
			Recap film · row 005
		</span>
		<div class="flex flex-col gap-0.5">
			<span class="font-display text-2xl font-bold tracking-[-0.03em] text-brand-ink">Priya Raman</span>
			<span class="font-sans text-[11px] text-black/60">MP4 · 15s</span>
		</div>
	</div>

	<img
		src="/landing/moment-event.jpg"
		alt=""
		width="512"
		height="342"
		loading="lazy"
		class="absolute -bottom-[58px] -right-[104px] h-[342px] w-[512px] rounded-tile border-2 border-brand-ink object-cover -rotate-3"
	/>
</div>
