import { writable } from "svelte/store";
import { get } from "svelte/store";
import { activeApiToken } from "./user.store";
import { getImages, getGifs } from "../api/media";

export const gifs = writable([]);
export const images = writable([]);

export const totalMediaCount = writable(0);

export const fetchGifs = async () => {
    const token = get(activeApiToken)?.token;

    const gifsData = await getGifs(token);
    gifs.set(gifsData);
}

export const fetchImages = async () => {
    const token = get(activeApiToken)?.token;
    const imagesData = await getImages(token);
    images.set(imagesData);
}