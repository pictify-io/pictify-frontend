import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

/**
 * Generation Limits Store
 * Tracks daily generation limits for guest users
 */

const STORAGE_KEY = 'pictify_generation_limits';
const DAILY_LIMIT = 5;

function getToday() {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

function loadFromStorage() {
  if (!browser) return { count: 0, date: getToday() };

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      // Reset if it's a new day
      if (data.date !== getToday()) {
        return { count: 0, date: getToday() };
      }
      return data;
    }
  } catch (e) {
    // Storage error
  }
  return { count: 0, date: getToday() };
}

function saveToStorage(data) {
  if (!browser) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    // Storage error
  }
}

// Create the store with initial value
const createStore = () => {
  const initialData = loadFromStorage();
  const { subscribe, set, update } = writable(initialData);

  return {
    subscribe,

    /**
     * Increment the generation count
     * Returns true if within limit, false if limit exceeded
     */
    increment: () => {
      let withinLimit = true;
      update(data => {
        // Reset if new day
        if (data.date !== getToday()) {
          data = { count: 0, date: getToday() };
        }

        data.count++;
        withinLimit = data.count <= DAILY_LIMIT;
        saveToStorage(data);
        return data;
      });
      return withinLimit;
    },

    /**
     * Check if user is within daily limit
     */
    isWithinLimit: () => {
      const data = get(generationLimits);
      // Reset count if new day
      if (data.date !== getToday()) {
        return true;
      }
      return data.count < DAILY_LIMIT;
    },

    /**
     * Get remaining generations for today
     */
    getRemaining: () => {
      const data = get(generationLimits);
      // Reset count if new day
      if (data.date !== getToday()) {
        return DAILY_LIMIT;
      }
      return Math.max(0, DAILY_LIMIT - data.count);
    },

    /**
     * Get current count
     */
    getCount: () => {
      const data = get(generationLimits);
      if (data.date !== getToday()) {
        return 0;
      }
      return data.count;
    },

    /**
     * Reset the counter (e.g., when user logs in)
     */
    reset: () => {
      const newData = { count: 0, date: getToday() };
      set(newData);
      saveToStorage(newData);
    },

    /**
     * Get the daily limit
     */
    getDailyLimit: () => DAILY_LIMIT,

    /**
     * Refresh from storage (useful on mount)
     */
    refresh: () => {
      const data = loadFromStorage();
      set(data);
    }
  };
};

export const generationLimits = createStore();
export const GUEST_DAILY_LIMIT = DAILY_LIMIT;
