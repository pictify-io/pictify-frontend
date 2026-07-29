/*
 * Written for Pictify (not part of the upstream app). Shared behaviour for the
 * Media and Audio panels: one hydration of the user's saved library, and one
 * upload path.
 *
 * Both panels needed the same three things (fetch on open, upload, remove) and
 * had already drifted apart on the two they shared. This is the single copy.
 */
import { useCallback, useEffect, useState } from "react";
import { getHostCallbacks } from "./runtime";
import { useMediaLibrary, kindForFile, MediaItem, MediaKind } from "./media-store";

let idCounter = 0;
const nextId = () => `media_${Date.now()}_${idCounter++}`;

/*
 * The store is a module singleton but the panels mount and unmount with their
 * tab, so "have we already fetched?" cannot live in component state. Holding
 * the in-flight promise here means the Media tab and the Audio tab opened in
 * the same tick share one request instead of racing to fire two.
 */
let inFlight: Promise<void> | null = null;

/**
 * Fill the library from the server, once. Panels call this on mount; the second
 * caller joins the first one's request.
 */
export function useMediaHydration() {
  const hydrated = useMediaLibrary((s) => s.hydrated);
  const loading = useMediaLibrary((s) => s.loading);
  const error = useMediaLibrary((s) => s.error);

  useEffect(() => {
    if (hydrated || inFlight) return;
    const load = getHostCallbacks().loadMedia;
    // No host callback means a context with no backend — the dev harness, or a
    // future embed. Mark it hydrated so the panel shows its empty state rather
    // than spinning forever on a request that will never be made.
    if (!load) {
      useMediaLibrary.getState().hydrate([]);
      return;
    }
    const store = useMediaLibrary.getState();
    store.setLoading(true);
    inFlight = load()
      .then((items) => {
        useMediaLibrary.getState().hydrate(
          (items || []).map((item) => ({
            id: item.uid ? `srv_${item.uid}` : nextId(),
            uid: item.uid,
            kind: item.kind,
            name: item.name,
            url: item.url,
            bytes: item.bytes,
            persistent: true,
            source: item.source || "library",
          }))
        );
      })
      .catch((err: any) => {
        const s = useMediaLibrary.getState();
        s.setLoading(false);
        s.setError(err?.message || "Your media library could not be loaded.");
      })
      .finally(() => {
        inFlight = null;
      });
  }, [hydrated]);

  return { loading, error };
}

/**
 * Drop the library so the next studio mount refetches. Called when the studio
 * unmounts: assets can be added elsewhere in the app (the image editor's brand
 * kit), and a stale list would hide them until a full page reload.
 */
export function resetMediaLibrary() {
  inFlight = null;
  useMediaLibrary.setState({ items: [], loading: false, hydrated: false, error: "" });
}

/**
 * The upload path shared by both panels.
 *
 * @param accept - which kinds this panel takes. A file of any other kind is
 *   skipped silently: the file input already filters by accept=, so anything
 *   here arrived by drag or by a browser ignoring the hint.
 */
export function useMediaUpload(accept: (kind: MediaKind) => boolean) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const addItem = useMediaLibrary((s) => s.addItem);

  const upload = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;
      setError("");
      setIsUploading(true);
      try {
        for (const file of Array.from(files)) {
          const kind = kindForFile(file);
          if (!kind || !accept(kind)) continue;
          const host = getHostCallbacks().uploadMedia;
          let url = "";
          let persistent = false;
          let uid: string | undefined;
          let bytes: number | undefined = file.size;
          if (host) {
            const result = await host(file);
            url = result.url;
            persistent = result.persistent;
            uid = result.uid;
            if (result.bytes != null) bytes = result.bytes;
          } else {
            url = URL.createObjectURL(file);
          }
          addItem({
            id: uid ? `srv_${uid}` : nextId(),
            uid,
            kind,
            name: file.name,
            url,
            bytes,
            persistent,
            // A failed upload leaves a blob: URL that only this tab can read.
            // Marking it 'session' keeps hydration from wiping it and keeps the
            // panel's "local" badge honest.
            source: persistent ? "library" : "session",
          });
        }
      } catch (err: any) {
        setError(err?.message || "Upload failed.");
      } finally {
        setIsUploading(false);
      }
    },
    [accept, addItem]
  );

  return { upload, isUploading, error, setError };
}

/**
 * Remove an item from the library.
 *
 * Optimistic: the row disappears immediately and comes back if the server says
 * no. Deleting media is a tidying action — making the user wait on a round trip
 * to see a thumbnail vanish is the wrong trade.
 */
export function useMediaRemove() {
  const removeItem = useMediaLibrary((s) => s.removeItem);
  const insertItem = useMediaLibrary((s) => s.insertItem);
  const [error, setError] = useState("");

  const remove = useCallback(
    async (item: MediaItem) => {
      setError("");
      // Remember where it sat, so a failed delete puts it back in place rather
      // than at the top — a row that moves looks like a different bug.
      const index = useMediaLibrary.getState().items.findIndex((i) => i.id === item.id);
      removeItem(item.id);
      // No uid means it was never saved server-side (a failed upload), so
      // dropping it from the list IS the whole deletion.
      if (!item.uid || item.source === "session") return;
      const del = getHostCallbacks().deleteMedia;
      if (!del) return;
      try {
        await del(item.uid);
      } catch (err: any) {
        insertItem(item, index);
        setError(err?.message || `${item.name} could not be removed.`);
      }
    },
    [removeItem, insertItem]
  );

  return { remove, error };
}
