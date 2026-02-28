import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Drama } from '../lib/api';
import {
  clearContinueWatchingInCloud,
  saveContinueWatchingToCloud,
} from '../lib/firebaseClient';

export type Platform = 'dramabox' | 'melolo' | 'netshort' | 'reelife';

export interface UserProfile {
  uid?: string;
  name: string;
  email: string;
  picture?: string;
}

export interface ContinueWatchingEntry {
  platform: Platform;
  dramaId: string;
  dramaTitle: string;
  dramaPoster: string;
  episodeId: string;
  episodeNo?: number;
  progress: number;
  timestamp: number;
}

type StoredMyListDrama = Drama & { _platform?: Platform };

interface StoreState {
  myList: StoredMyListDrama[];
  addToList: (drama: Drama) => void;
  removeFromList: (id: string) => void;
  isInList: (id: string) => boolean;
  clearMyListForCurrentPlatform: () => void;
  clearAllMyList: () => void;

  continueWatching: Record<string, Record<string, ContinueWatchingEntry>>;
  updateProgress: (drama: Drama, episodeId: string, progress: number, platform?: Platform, episodeNo?: number) => void;
  getContinueWatchingForCurrentUser: () => ContinueWatchingEntry[];
  clearContinueWatchingForCurrentUser: () => void;
  setContinueWatchingForCurrentUser: (entries: ContinueWatchingEntry[]) => void;

  user: UserProfile | null;
  login: (user: UserProfile) => void;
  logout: () => void;

  platform: Platform;
  setPlatform: (platform: Platform) => void;
}

const CONTINUE_PROGRESS_MIN_SECONDS = 1;
const storageVersion = 4;

const getUserKey = (user: UserProfile | null) => user?.email?.toLowerCase() || 'guest';
const PLACEHOLDER_POSTER = '/images/placeholder-poster.svg';
const isInvalidDramaTitle = (title: string | undefined | null, dramaId?: string) => {
  const normalized = String(title || '').trim();
  if (!normalized) return true;
  if (normalized === 'Unknown Title') return true;
  if (dramaId && normalized === String(dramaId)) return true;
  if (/^\d{8,}$/.test(normalized)) return true;
  return false;
};
const isUsablePoster = (poster?: string | null) => {
  const value = String(poster || '').trim();
  if (!value) return false;
  if (value === PLACEHOLDER_POSTER) return false;
  if (value.includes('/images/placeholder-')) return false;
  if (value.includes('Poster Unavailable')) return false;
  return true;
};

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      myList: [],
      addToList: (drama) =>
        set((state) => {
          const dramaId = drama.bookId || drama.id;
          const activePlatform = get().platform;
          if (
            !dramaId ||
            state.myList.some((item) => (item.bookId || item.id) === dramaId && (item._platform || 'dramabox') === activePlatform)
          ) {
            return state;
          }
          return { myList: [...state.myList, { ...drama, _platform: activePlatform }] };
        }),
      removeFromList: (id) =>
        set((state) => {
          const activePlatform = get().platform;
          return {
            myList: state.myList.filter(
              (d) => !((d.bookId || d.id) === id && (d._platform || 'dramabox') === activePlatform)
            ),
          };
        }),
      isInList: (id) => {
        const activePlatform = get().platform;
        return get().myList.some((d) => (d.bookId || d.id) === id && (d._platform || 'dramabox') === activePlatform);
      },
      clearMyListForCurrentPlatform: () =>
        set((state) => {
          const activePlatform = get().platform;
          return {
            myList: state.myList.filter((item) => (item._platform || 'dramabox') !== activePlatform),
          };
        }),
      clearAllMyList: () => set({ myList: [] }),

      continueWatching: {},
      updateProgress: (drama, episodeId, progress, platform, episodeNo) => {
        if (!drama) return;
        if (progress < CONTINUE_PROGRESS_MIN_SECONDS) return;

        const dramaId = drama.bookId || drama.id;
        if (!dramaId) return;

        const userKey = getUserKey(get().user);
        const activePlatform = platform || get().platform;
        const scopedDramaKey = `${activePlatform}:${dramaId}`;

        let entryForCloud: ContinueWatchingEntry | null = null;

        set((state) => {
          const existing = state.continueWatching[userKey]?.[scopedDramaKey];
          const existingPoster = existing?.dramaPoster;
          const selectedPoster = isUsablePoster(drama.poster)
            ? String(drama.poster)
            : isUsablePoster(existingPoster)
              ? String(existingPoster)
              : PLACEHOLDER_POSTER;
          const resolvedTitle = !isInvalidDramaTitle(drama.title, dramaId)
            ? String(drama.title).trim()
            : !isInvalidDramaTitle(existing?.dramaTitle, dramaId)
              ? String(existing?.dramaTitle).trim()
              : 'Tanpa Judul';

          const nextEntry: ContinueWatchingEntry = {
            platform: activePlatform,
            dramaId,
            dramaTitle: resolvedTitle,
            dramaPoster: selectedPoster,
            episodeId: String(episodeId),
            episodeNo:
              typeof episodeNo === 'number' && Number.isFinite(episodeNo) && episodeNo > 0
                ? Math.floor(episodeNo)
                : existing?.episodeNo,
            progress: Number(progress),
            timestamp: Date.now(),
          };

          entryForCloud = nextEntry;

          return {
            continueWatching: {
              ...state.continueWatching,
              [userKey]: {
                ...(state.continueWatching[userKey] || {}),
                [scopedDramaKey]: nextEntry,
              },
            },
          };
        });

        const currentUser = get().user;
        if (currentUser?.uid && entryForCloud) {
          void saveContinueWatchingToCloud(currentUser.uid, entryForCloud).catch((error) => {
            console.error('Failed to save continue watching to cloud', error);
          });
        }
      },
      getContinueWatchingForCurrentUser: () => {
        const userKey = getUserKey(get().user);
        const byDrama = get().continueWatching[userKey] || {};
        const list = get().myList;
        const currentPlatform = get().platform;
        return Object.values(byDrama)
          .filter((entry) => (entry.platform || 'dramabox') === currentPlatform)
          .map((entry) => ({
            ...entry,
            dramaTitle:
              !isInvalidDramaTitle(entry.dramaTitle, entry.dramaId) ? entry.dramaTitle : 'Tanpa Judul',
            dramaPoster:
              isUsablePoster(entry.dramaPoster)
                ? entry.dramaPoster
                : list.find(
                    (item) =>
                      (item.bookId || item.id) === entry.dramaId &&
                      ((item as any)?._platform || 'dramabox') === (entry.platform || 'dramabox') &&
                      isUsablePoster(item.poster)
                  )?.poster || PLACEHOLDER_POSTER,
          }))
          .sort((a, b) => b.timestamp - a.timestamp);
      },
      clearContinueWatchingForCurrentUser: () => {
        const currentUser = get().user;
        const userKey = getUserKey(currentUser);
        set((state) => {
          const next = { ...state.continueWatching };
          delete next[userKey];
          return { continueWatching: next };
        });

        if (currentUser?.uid) {
          void clearContinueWatchingInCloud(currentUser.uid).catch((error) => {
            console.error('Failed to clear continue watching in cloud', error);
          });
        }
      },
      setContinueWatchingForCurrentUser: (entries) => {
        const userKey = getUserKey(get().user);
        const normalizedEntries = Array.isArray(entries) ? entries : [];
        const byDrama = normalizedEntries.reduce<Record<string, ContinueWatchingEntry>>((acc, entry) => {
          const platform = (entry.platform || 'dramabox') as Platform;
          const dramaId = String(entry.dramaId || '').trim();
          if (!dramaId) return acc;

          const scopedKey = `${platform}:${dramaId}`;
          acc[scopedKey] = {
            platform,
            dramaId,
            dramaTitle: !isInvalidDramaTitle(entry.dramaTitle, dramaId) ? entry.dramaTitle : 'Tanpa Judul',
            dramaPoster: isUsablePoster(entry.dramaPoster) ? entry.dramaPoster : PLACEHOLDER_POSTER,
            episodeId: String(entry.episodeId || '1'),
            episodeNo:
              typeof entry.episodeNo === 'number' && Number.isFinite(entry.episodeNo) && entry.episodeNo > 0
                ? Math.floor(entry.episodeNo)
                : undefined,
            progress: Number(entry.progress || 0),
            timestamp: Number(entry.timestamp || Date.now()),
          };
          return acc;
        }, {});

        set((state) => ({
          continueWatching: {
            ...state.continueWatching,
            [userKey]: byDrama,
          },
        }));
      },

      user: null,
      login: (user) => set({ user }),
      logout: () => set({ user: null }),

      platform: 'dramabox',
      setPlatform: (platform) => set({ platform }),
    }),
    {
      name: 'netflix-clone-storage',
      version: storageVersion,
      migrate: (persistedState: any, version) => {
        if (!persistedState) return persistedState;

        if (version < storageVersion) {
          const legacy = persistedState.continueWatching;
          const migrated: Record<string, Record<string, ContinueWatchingEntry>> = {};
          const defaultPlatform: Platform = persistedState?.platform || 'dramabox';
          const toEntry = (dramaId: string, value: any, scopedKey?: string): ContinueWatchingEntry => {
            const keyPlatform = scopedKey?.includes(':') ? (scopedKey.split(':')[0] as Platform) : undefined;
            const platform = value?.platform || keyPlatform || defaultPlatform;
            return {
              platform,
              dramaId,
              dramaTitle: value?.dramaTitle || 'Unknown Title',
              dramaPoster: value?.dramaPoster || '/images/placeholder-poster.svg',
              episodeId: value?.episodeId || '1',
              episodeNo:
                typeof value?.episodeNo === 'number' && Number.isFinite(value.episodeNo) && value.episodeNo > 0
                  ? Math.floor(value.episodeNo)
                  : undefined,
              progress: Number(value?.progress || 0),
              timestamp: Number(value?.timestamp || Date.now()),
            };
          };

          if (legacy && typeof legacy === 'object') {
            const legacyValues = Object.values(legacy);
            const isFlatLegacy =
              legacyValues.length > 0 &&
              legacyValues.every((v: any) => v && typeof v === 'object' && ('episodeId' in v || 'dramaTitle' in v));

            if (isFlatLegacy) {
              const guestRecords: Record<string, ContinueWatchingEntry> = {};
              Object.entries(legacy).forEach(([dramaId, value]: [string, any]) => {
                const entry = toEntry(dramaId, value);
                guestRecords[`${entry.platform}:${dramaId}`] = entry;
              });
              migrated.guest = guestRecords;
            } else {
              Object.entries(legacy).forEach(([userKey, value]: [string, any]) => {
                if (!value || typeof value !== 'object') return;
                const userRecords: Record<string, ContinueWatchingEntry> = {};
                Object.entries(value as Record<string, any>).forEach(([scopedKey, item]) => {
                  const derivedDramaId = item?.dramaId || (scopedKey.includes(':') ? scopedKey.split(':').slice(1).join(':') : scopedKey);
                  const entry = toEntry(derivedDramaId, item, scopedKey);
                  userRecords[`${entry.platform}:${derivedDramaId}`] = entry;
                });
                if (Object.keys(userRecords).length > 0) {
                  migrated[userKey] = userRecords;
                }
              });
            }
          }

          return {
            ...persistedState,
            myList: Array.isArray(persistedState.myList)
              ? persistedState.myList.map((item: any) => ({
                  ...item,
                  _platform: item?._platform || defaultPlatform,
                }))
              : [],
            continueWatching: migrated,
          };
        }

        return persistedState;
      },
    }
  )
);
