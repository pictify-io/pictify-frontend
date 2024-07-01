import { writable } from 'svelte/store';
import { get } from 'svelte/store';
import { activeApiToken } from './user.store';
import { getImages, getGifs } from '../api/media';

export const gifs = writable([]);
export const images = writable([]);

export const totalMediaCount = writable(0);

export const fetchGifs = async () => {
	// const token = get(activeApiToken)?.token;
	// if (!token) return console.error('No token found');

	const gifsData = await getGifs();
	gifs.set(gifsData);
};

export const fetchImages = async () => {
	// const token = get(activeApiToken)?.token;
	// if (!token) return console.error('No token found');
	const imagesData = await getImages();
	images.set(imagesData);
};
