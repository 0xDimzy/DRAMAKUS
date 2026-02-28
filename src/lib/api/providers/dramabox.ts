import api from '../client';
import { normalizeDrama, normalizeDramaboxList } from '../normalizers';
import { API_CODE, Episode } from '../types';
import { normalizePlaybackUrl } from '../url';

const BASE = '/api/proxy';
const normalizeDuration = (value: any) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const totalSeconds = value > 10_000 ? Math.floor(value / 1000) : Math.floor(value);
    const mins = Math.floor(totalSeconds / 60);
    const secs = String(totalSeconds % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  }
  if (typeof value === 'string' && value.trim()) {
    const raw = value.trim();
    if (/^\d+$/.test(raw)) {
      const parsed = Number(raw);
      const totalSeconds = parsed > 10_000 ? Math.floor(parsed / 1000) : parsed;
      const mins = Math.floor(totalSeconds / 60);
      const secs = String(totalSeconds % 60).padStart(2, '0');
      return `${mins}:${secs}`;
    }
    return raw;
  }
  return '';
};

export const dramaboxProvider = {
  async fetchHomepage(page = 1) {
    const { data } = await api.get(`${BASE}/homepage?page=${page}&lang=in`);
    return normalizeDramaboxList(data);
  },
  async fetchTrending() {
    const { data } = await api.get(`${BASE}/trending?lang=in`);
    return normalizeDramaboxList(data);
  },
  async fetchLatest() {
    const { data } = await api.get(`${BASE}/latest?lang=in`);
    return normalizeDramaboxList(data);
  },
  async fetchForYou() {
    const { data } = await api.get(`${BASE}/foryou?lang=in`);
    return normalizeDramaboxList(data);
  },
  async fetchVIP() {
    const { data } = await api.get(`${BASE}/vip?lang=in`);
    return normalizeDramaboxList(data);
  },
  async fetchDubIndo(page = 1, classify = 'terpopuler') {
    const { data } = await api.get(`${BASE}/dubbed?classify=${classify}&page=${page}&lang=in`);
    return normalizeDramaboxList(data);
  },
  async fetchRandom() {
    const { data } = await api.get(`${BASE}/randomdrama?lang=in`);
    return normalizeDramaboxList(data);
  },
  async searchDrama(query: string) {
    const { data } = await api.get(`${BASE}/search?query=${query}&lang=in`);
    return normalizeDramaboxList(data);
  },
  async fetchDetail(bookId: string) {
    const { data } = await api.get(`${BASE}/detail?bookId=${bookId}&lang=in&code=${API_CODE}`);
    const detail = data.results || data.data || data;
    return normalizeDrama(detail);
  },
  async fetchVideoUrl(_episodeId: string, _bookId?: string) {
    return '';
  },
  async fetchEpisodes(bookId: string): Promise<Episode[]> {
    const { data } = await api.get(`${BASE}/allepisode?bookId=${bookId}&code=${API_CODE}`);
    const list = Array.isArray(data) ? data : data.results || data.data || [];

    return list.map((ep: any, index: number) => {
      const episodeNo = ep.sort || ep.episode || ep.episodeNo || index + 1;

      return {
        ...ep,
        id: String(ep.id || ep.episodeId || ep.episode_id || ep.sort || ep.episode || `ep-${index}`),
        title: ep.title || ep.episodeName || ep.name || `Episode ${episodeNo}`,
        duration: normalizeDuration(
          ep.duration ||
          ep.time ||
          ep.videoDuration ||
          ep.video_duration ||
          ep.timeLength ||
          ep.playTime ||
          ep.play_time ||
          ep.seconds ||
          ep.length
        ),
        url: (() => {
          let videoUrl =
            ep.url || ep.videoUrl || ep.video_url || ep.playUrl || ep.play_url || ep.m3u8 || ep.m3u8_url || '';
          if (videoUrl && !videoUrl.includes('code=')) {
            const separator = videoUrl.includes('?') ? '&' : '?';
            videoUrl += `${separator}code=${API_CODE}`;
          }
          return normalizePlaybackUrl(videoUrl);
        })(),
      };
    });
  },
};


