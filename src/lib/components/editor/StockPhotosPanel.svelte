<script>
	import { editor } from '../../../store/editor.store';
	import { FabricImage } from 'fabric';
	import {
		UNSPLASH_CONFIG,
		isUnsplashConfigured,
		getUnsplashAttributionUrl
	} from '../../config/unsplash.js';

	let searchQuery = '';
	let photos = [];
	let loading = false;
	let error = null;
	let page = 1;
	let hasMore = true;

	// Check if Unsplash is configured
	const isConfigured = isUnsplashConfigured();

	// Popular search suggestions
	const suggestions = [
		'Abstract',
		'Business',
		'Nature',
		'Technology',
		'People',
		'Office',
		'Workspace',
		'City',
		'Food',
		'Travel',
		'Fashion',
		'Minimal',
		'Colorful',
		'Dark',
		'Light'
	];

	// Featured/trending photos on initial load
	let featuredPhotos = [];

	async function loadFeaturedPhotos() {
		loading = true;
		error = null;

		// Use demo photos if Unsplash is not configured
		if (!isConfigured) {
			photos = getDemoPhotos();
			featuredPhotos = photos;
			loading = false;
			return;
		}

		try {
			// Use a demo endpoint with curated photos
			const response = await fetch(
				`${UNSPLASH_CONFIG.API_BASE_URL}/photos/random?count=${UNSPLASH_CONFIG.DEFAULT_PER_PAGE}&client_id=${UNSPLASH_CONFIG.ACCESS_KEY}`
			);

			if (!response.ok) {
				// Fallback to demo photos if API fails
				photos = getDemoPhotos();
				featuredPhotos = photos;
				return;
			}

			const data = await response.json();
			photos = data.map((photo) => ({
				id: photo.id,
				url: photo.urls.small,
				regularUrl: photo.urls.regular,
				downloadLocation: photo.links.download_location,
				author: photo.user.name,
				authorUsername: photo.user.username,
				authorUrl: `${photo.user.links.html}?utm_source=${UNSPLASH_CONFIG.UTM_SOURCE}&utm_medium=${UNSPLASH_CONFIG.UTM_MEDIUM}`,
				description: photo.description || photo.alt_description || 'Photo'
			}));
			featuredPhotos = photos;
		} catch (err) {
			console.error('Error loading featured photos:', err);
			// Use demo photos as fallback
			photos = getDemoPhotos();
			featuredPhotos = photos;
		} finally {
			loading = false;
		}
	}

	async function searchPhotos(query, pageNum = 1) {
		if (!query.trim()) {
			photos = featuredPhotos;
			return;
		}

		loading = true;
		error = null;

		// Use demo photos if Unsplash is not configured
		if (!isConfigured) {
			photos = getDemoPhotos();
			loading = false;
			hasMore = false;
			return;
		}

		try {
			const response = await fetch(
				`${UNSPLASH_CONFIG.API_BASE_URL}/search/photos?query=${encodeURIComponent(
					query
				)}&page=${pageNum}&per_page=${UNSPLASH_CONFIG.DEFAULT_PER_PAGE}&client_id=${
					UNSPLASH_CONFIG.ACCESS_KEY
				}`
			);

			if (!response.ok) {
				throw new Error('Failed to search photos');
			}

			const data = await response.json();
			const newPhotos = data.results.map((photo) => ({
				id: photo.id,
				url: photo.urls.small,
				regularUrl: photo.urls.regular,
				downloadLocation: photo.links.download_location,
				author: photo.user.name,
				authorUsername: photo.user.username,
				authorUrl: `${photo.user.links.html}?utm_source=${UNSPLASH_CONFIG.UTM_SOURCE}&utm_medium=${UNSPLASH_CONFIG.UTM_MEDIUM}`,
				description: photo.description || photo.alt_description || query
			}));

			if (pageNum === 1) {
				photos = newPhotos;
			} else {
				photos = [...photos, ...newPhotos];
			}

			hasMore = data.results.length === UNSPLASH_CONFIG.DEFAULT_PER_PAGE;
			page = pageNum;
		} catch (err) {
			console.error('Error searching photos:', err);
			error = 'Unable to search photos. Please try again.';
			// Show demo photos on error
			if (pageNum === 1) {
				photos = getDemoPhotos();
			}
		} finally {
			loading = false;
		}
	}

	function getDemoPhotos() {
		// Fallback demo photos using placeholder service
		return Array.from({ length: 12 }, (_, i) => ({
			id: `demo-${i}`,
			url: `https://picsum.photos/400/300?random=${i}`,
			regularUrl: `https://picsum.photos/800/600?random=${i}`,
			downloadLocation: null,
			author: 'Lorem Picsum',
			authorUsername: 'picsum',
			authorUrl: 'https://picsum.photos',
			description: 'Demo Photo'
		}));
	}

	async function addPhotoToCanvas(photo) {
		if (!$editor) return;

		try {
			// Show loading state
			loading = true;

			// Use regular size for better quality
			const img = await FabricImage.fromURL(photo.regularUrl, { crossOrigin: 'anonymous' });

			const center = $editor.getCenter();
			img.set({
				left: center.left,
				top: center.top,
				originX: 'center',
				originY: 'center'
			});

			// Scale to fit canvas nicely
			const maxSize = Math.min($editor.width, $editor.height) * 0.6;
			if (img.width > maxSize) {
				img.scaleToWidth(maxSize);
			}
			if (img.getScaledHeight() > maxSize) {
				img.scaleToHeight(maxSize);
			}

			// Add photo metadata for attribution (Unsplash API requirement)
			img.set('name', photo.description || 'Photo');
			img.set('photoCredit', `Photo by ${photo.author} on Unsplash`);
			img.set('photoAuthor', photo.author);
			img.set('photoAuthorUrl', photo.authorUrl);
			img.set('photoSource', 'Unsplash');
			img.set('photoSourceUrl', getUnsplashAttributionUrl());

			$editor.add(img);
			$editor.setActiveObject(img);
			$editor.renderAll();

			// Track download for Unsplash API guidelines
			// This is REQUIRED by Unsplash when user adds photo to canvas
			triggerDownload(photo);
		} catch (err) {
			console.error('Error adding photo to canvas:', err);
			error = 'Failed to add photo. Please try again.';
		} finally {
			loading = false;
		}
	}

	async function triggerDownload(photo) {
		// Unsplash API requires tracking downloads
		// Must hit the download_location endpoint as per API guidelines
		if (photo.downloadLocation && isConfigured) {
			try {
				await fetch(`${photo.downloadLocation}?client_id=${UNSPLASH_CONFIG.ACCESS_KEY}`);
			} catch (err) {
				console.error('Error tracking download:', err);
				// Silent fail - don't block user experience
			}
		}
	}

	function handleSearch() {
		searchPhotos(searchQuery, 1);
	}

	function handleSuggestionClick(suggestion) {
		searchQuery = suggestion;
		searchPhotos(suggestion, 1);
	}

	function loadMore() {
		if (searchQuery) {
			searchPhotos(searchQuery, page + 1);
		}
	}

	// Load featured photos on mount
	$: if (photos.length === 0 && !loading) {
		loadFeaturedPhotos();
	}
</script>

<div class="stock-photos-panel">
	<!-- Search Box -->
	<div class="search-section">
		<div class="search-box">
			<svg
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<circle cx="11" cy="11" r="8" />
				<path d="M21 21l-4.35-4.35" />
			</svg>
			<input
				type="search"
				placeholder="Search free photos..."
				bind:value={searchQuery}
				on:keydown={(e) => e.key === 'Enter' && handleSearch()}
			/>
			{#if searchQuery}
				<button
					class="clear-btn"
					on:click={() => {
						searchQuery = '';
						photos = featuredPhotos;
					}}
				>
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<line x1="18" y1="6" x2="6" y2="18" />
						<line x1="6" y1="6" x2="18" y2="18" />
					</svg>
				</button>
			{/if}
		</div>
		<button class="search-btn" on:click={handleSearch} disabled={loading}>
			{loading ? 'Searching...' : 'Search'}
		</button>
	</div>

	<!-- Suggestions -->
	{#if !searchQuery && suggestions.length > 0}
		<div class="suggestions">
			<div class="suggestions-label">Popular:</div>
			<div class="suggestions-tags">
				{#each suggestions as suggestion}
					<button class="tag" on:click={() => handleSuggestionClick(suggestion)}>
						{suggestion}
					</button>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Error Message -->
	{#if error}
		<div class="error-message">
			<i class="fa fa-exclamation-circle" />
			{error}
		</div>
	{/if}

	<!-- API Key Notice -->
	{#if !isConfigured}
		<div class="info-message">
			<i class="fa fa-info-circle" />
			<div>
				<strong>Using Demo Photos</strong>
				<p>
					Add your Unsplash API key for unlimited access. <a
						href="https://unsplash.com/developers"
						target="_blank">Get free API key →</a
					>
				</p>
			</div>
		</div>
	{/if}

	<!-- Photos Grid -->
	{#if loading && photos.length === 0}
		<div class="loading-state">
			<i class="fa fa-spinner fa-spin" />
			<p>Loading photos...</p>
		</div>
	{:else if photos.length > 0}
		<div class="photos-grid">
			{#each photos as photo (photo.id)}
				<div class="photo-container">
					<button
						class="photo-item"
						on:click={() => addPhotoToCanvas(photo)}
						title="{photo.description} by {photo.author}"
					>
						<img src={photo.url} alt={photo.description} loading="lazy" />
						<div class="photo-overlay">
							<div class="photo-info">
								<i class="fa fa-plus" />
								<span>Add to canvas</span>
							</div>
						</div>
					</button>
					<div class="photo-attribution">
						<span>Photo by </span>
						<a
							href={photo.authorUrl}
							target="_blank"
							rel="noopener noreferrer"
							on:click|stopPropagation
						>
							{photo.author}
						</a>
						<span> on </span>
						<a
							href={getUnsplashAttributionUrl()}
							target="_blank"
							rel="noopener noreferrer"
							on:click|stopPropagation
						>
							Unsplash
						</a>
					</div>
				</div>
			{/each}
		</div>

		<!-- Load More -->
		{#if hasMore && !loading}
			<button class="load-more-btn" on:click={loadMore}> Load More Photos </button>
		{/if}

		{#if loading && photos.length > 0}
			<div class="loading-more">
				<i class="fa fa-spinner fa-spin" />
			</div>
		{/if}
	{:else if !loading}
		<div class="empty-state">
			<i class="fa fa-image" />
			<p>No photos found</p>
			<span>Try a different search term</span>
		</div>
	{/if}

	<!-- Footer Credit -->
	<div class="footer-credit">
		<span>Photos powered by</span>
		<a href={getUnsplashAttributionUrl()} target="_blank"> Unsplash </a>
	</div>
</div>

<style>
	.stock-photos-panel {
		display: flex;
		flex-direction: column;
		gap: 12px;
		height: 100%;
		width: 100%;
		overflow-y: auto;
		overflow-x: hidden;
		box-sizing: border-box;
		background: #fffdf8;
		padding: 16px;
	}

	/* Search Section */
	.search-section {
		display: flex;
		gap: 8px;
		position: sticky;
		top: 0;
		background: #fffdf8;
		z-index: 10;
		padding-bottom: 8px;
		padding-right: 8px;
		align-items: center;
		width: 100%;
		box-sizing: border-box;
	}

	.search-box {
		position: relative;
		flex: 1;
		min-width: 0;
	}

	.search-box svg {
		position: absolute;
		left: 12px;
		top: 50%;
		transform: translateY(-50%);
		color: #111827;
	}

	.search-box input {
		width: 100%;
		padding: 8px 32px 8px 36px;
		border: 2px solid #111827;
		border-radius: 6px;
		font-size: 13px;
		box-sizing: border-box;
		font-weight: 600;
		color: #111827;
		box-shadow: 2px 2px 0 0 #111827;
		transition: all 0.1s;
		text-transform: uppercase;
	}

	.search-box input:focus {
		outline: none;
		border-color: #111827;
		box-shadow: 2px 2px 0 0 #ffc480;
		transform: translate(-1px, -1px);
	}

	.clear-btn {
		position: absolute;
		right: 8px;
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		cursor: pointer;
		color: #999;
		padding: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
	}

	.clear-btn:hover {
		background: #f5f5f5;
		color: #666;
	}

	.search-btn {
		padding: 8px 12px;
		background: #111827;
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 12px;
		font-weight: 800;
		cursor: pointer;
		transition: all 0.15s;
		white-space: nowrap;
		flex-shrink: 0;
		min-width: 70px;
		text-transform: uppercase;
		box-shadow: 2px 2px 0 0 #000;
	}

	.search-btn:hover:not(:disabled) {
		background: #000;
		transform: translate(-1px, -1px);
		box-shadow: 4px 4px 0 0 #ffc480;
		color: #ffc480;
	}

	.search-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	/* Suggestions */
	.suggestions {
		display: flex;
		flex-direction: column;
		gap: 8px;
		width: 100%;
		padding-right: 8px;
		box-sizing: border-box;
	}

	.suggestions-label {
		font-size: 11px;
		font-weight: 900;
		color: #111827;
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.suggestions-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		width: 100%;
		max-width: 100%;
		box-sizing: border-box;
	}

	.tag {
		padding: 4px 10px;
		background: #fff;
		border: 2px solid #111827;
		border-radius: 12px;
		font-size: 11px;
		color: #111827;
		cursor: pointer;
		transition: all 0.15s;
		font-weight: 700;
		text-transform: uppercase;
	}

	.tag:hover {
		background: #111827;
		color: #fff;
		border-color: #111827;
		transform: translate(-1px, -1px);
		box-shadow: 2px 2px 0 0 #ffc480;
	}

	/* Messages */
	.error-message,
	.info-message {
		padding: 12px;
		padding-right: 20px;
		border-radius: 6px;
		font-size: 12px;
		display: flex;
		gap: 8px;
		align-items: flex-start;
		width: 100%;
		box-sizing: border-box;
		border: 2px solid #111827;
		box-shadow: 4px 4px 0 0 #111827;
		font-weight: 500;
	}

	.error-message {
		background: #fee;
		color: #c33;
	}

	.info-message {
		background: #e0f2fe;
		color: #0369a1;
		flex-direction: row;
	}

	.info-message i {
		margin-top: 2px;
	}

	.info-message strong {
		display: block;
		margin-bottom: 4px;
		font-size: 13px;
	}

	.info-message p {
		margin: 0;
		font-size: 11px;
		line-height: 1.4;
	}

	.info-message a {
		color: #0369a1;
		text-decoration: underline;
	}

	/* Loading State */
	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 40px 28px 40px 20px;
		color: #111827;
		gap: 8px;
	}

	.loading-state i {
		font-size: 24px;
		color: #111827;
	}

	/* Photos Grid */
	.photos-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 16px;
		width: 100%;
		padding-right: 8px;
		box-sizing: border-box;
	}

	.photo-container {
		display: flex;
		flex-direction: column;
		gap: 8px;
		width: 100%;
		max-width: 100%;
		box-sizing: border-box;
	}

	.photo-item {
		position: relative;
		width: 100%;
		padding-top: 56.25%; /* 16:9 aspect ratio */
		overflow: hidden;
		border-radius: 8px;
		border: 2px solid #111827;
		cursor: pointer;
		background: #f5f5f5;
		box-shadow: 2px 2px 0 0 #111827;
		transition: all 0.1s;
	}

	.photo-item:hover {
		transform: translate(-2px, -2px);
		box-shadow: 4px 4px 0 0 #ffc480;
	}

	.photo-item img {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.3s;
		display: block;
	}

	.photo-overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(to bottom, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0.7));
		opacity: 0;
		transition: opacity 0.2s;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding: 12px;
		color: white;
	}

	.photo-item:hover .photo-overlay {
		opacity: 1;
	}

	.photo-item:hover img {
		transform: scale(1.05);
	}

	.photo-info {
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 1;
		font-size: 14px;
		font-weight: 700;
		gap: 8px;
		text-transform: uppercase;
	}

	.photo-info i {
		font-size: 18px;
	}

	.photo-attribution {
		font-size: 10px;
		color: #111827;
		line-height: 1.4;
		padding: 0 2px;
		word-wrap: break-word;
		overflow-wrap: break-word;
		max-width: 100%;
		box-sizing: border-box;
		font-weight: 600;
	}

	.photo-attribution a {
		color: #111827;
		text-decoration: none;
		font-weight: 800;
		word-break: break-word;
	}

	.photo-attribution a:hover {
		text-decoration: underline;
		color: #ffc480;
		background: #111827;
	}

	/* Load More */
	.load-more-btn {
		width: calc(100% - 8px);
		margin-right: 8px;
		padding: 12px;
		background: white;
		border: 2px solid #111827;
		border-radius: 6px;
		cursor: pointer;
		font-size: 13px;
		font-weight: 700;
		color: #111827;
		transition: all 0.15s;
		box-sizing: border-box;
		text-transform: uppercase;
		box-shadow: 2px 2px 0 0 #111827;
	}

	.load-more-btn:hover {
		background: #111827;
		color: #fff;
		transform: translate(-1px, -1px);
		box-shadow: 4px 4px 0 0 #ffc480;
	}

	.loading-more {
		text-align: center;
		padding: 12px;
		padding-right: 20px;
		color: #111827;
	}

	/* Empty State */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 40px 28px 40px 20px;
		color: #111827;
		gap: 8px;
	}

	.empty-state i {
		font-size: 48px;
		opacity: 0.3;
	}

	.empty-state p {
		font-size: 14px;
		font-weight: 700;
		margin: 0;
		text-transform: uppercase;
	}

	.empty-state span {
		font-size: 12px;
	}

	/* Footer */
	.footer-credit {
		position: sticky;
		bottom: 0;
		background: #fffdf8;
		border-top: 3px solid #111827;
		padding: 8px;
		padding-right: 16px;
		text-align: center;
		font-size: 10px;
		color: #111827;
		margin-top: auto;
		width: 100%;
		box-sizing: border-box;
		font-weight: 600;
	}

	.footer-credit a {
		color: #111827;
		text-decoration: none;
		font-weight: 800;
	}

	.footer-credit a:hover {
		text-decoration: underline;
	}

	/* Scrollbar */
	.stock-photos-panel::-webkit-scrollbar {
		width: 6px;
	}

	.stock-photos-panel::-webkit-scrollbar-track {
		background: transparent;
	}

	.stock-photos-panel::-webkit-scrollbar-thumb {
		background: #111827;
		border-radius: 3px;
	}

	.stock-photos-panel::-webkit-scrollbar-thumb:hover {
		background: #000;
	}
</style>
