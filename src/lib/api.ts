import { useStore } from '../store/useStore';
import api from './api/client';
import { dramaboxProvider } from './api/providers/dramabox';
import { meloloProvider } from './api/providers/melolo';
import { netshortProvider } from './api/providers/netshort';
import { reelifeProvider } from './api/providers/reelife';
import { Drama, Episode } from './api/types';

export type { Drama, Episode };

interface PlatformProvider {
  fetchHomepage: (page?: number) => Promise<Drama[]>;
  fetchTrending: () => Promise<Drama[]>;
  fetchLatest: () => Promise<Drama[]>;
  fetchForYou: () => Promise<Drama[]>;
  fetchVIP: () => Promise<Drama[]>;
  fetchDubIndo: (page?: number, classify?: string) => Promise<Drama[]>;
  fetchRandom: () => Promise<Drama[]>;
  searchDrama: (query: string) => Promise<Drama[]>;
  fetchDetail: (bookId: string) => Promise<Drama>;
  fetchVideoUrl: (episodeId: string, bookId?: string) => Promise<string>;
  fetchEpisodes: (bookId: string) => Promise<Episode[]>;
}

const getProvider = () => {
  const platform = useStore.getState().platform;
  if (platform === 'melolo') return meloloProvider as PlatformProvider;
  if (platform === 'netshort') return netshortProvider as PlatformProvider;
  if (platform === 'reelife') return reelifeProvider as PlatformProvider;
  return dramaboxProvider as PlatformProvider;
};

export const fetchHomepage = (page = 1) => getProvider().fetchHomepage(page);
export const fetchTrending = () => getProvider().fetchTrending();
export const fetchLatest = () => getProvider().fetchLatest();
export const fetchForYou = () => getProvider().fetchForYou();
export const fetchVIP = () => getProvider().fetchVIP();
export const fetchDubIndo = (page = 1, classify = 'terpopuler') => getProvider().fetchDubIndo(page, classify);
export const fetchRandom = () => getProvider().fetchRandom();
export const searchDrama = (query: string) => getProvider().searchDrama(query);
export const fetchDetail = (bookId: string) => getProvider().fetchDetail(bookId);
export const fetchVideoUrl = (episodeId: string, bookId?: string) => getProvider().fetchVideoUrl(episodeId, bookId);
export const fetchEpisodes = (bookId: string) => getProvider().fetchEpisodes(bookId);

export default api;
