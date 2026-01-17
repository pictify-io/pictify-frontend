import { writable } from 'svelte/store';
import { getImages, getGifs, getPdfs } from '../api/media';

// Store structure: { items: [], pagination: { total, limit, offset, hasMore } }
export const gifs = writable({
	gifs: [],
	pagination: { total: 0, limit: 12, offset: 0, hasMore: false }
});
export const images = writable({
	images: [],
	pagination: { total: 0, limit: 12, offset: 0, hasMore: false }
});
export const pdfs = writable({
	pdfs: [],
	pagination: { total: 0, limit: 12, offset: 0, hasMore: false }
});

export const fetchGifs = async ({ limit = 12, offset = 0 } = {}) => {
	const gifsData = await getGifs({ limit, offset });
	gifs.set(gifsData);
	return gifsData;
};

export const fetchImages = async ({ limit = 12, offset = 0 } = {}) => {
	const imagesData = await getImages({ limit, offset });
	images.set(imagesData);
	return imagesData;
};

export const fetchPdfs = async ({ limit = 12, offset = 0 } = {}) => {
	const pdfsData = await getPdfs({ limit, offset });
	pdfs.set(pdfsData);
	return pdfsData;
};
