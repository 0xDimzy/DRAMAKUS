import api from '../client';
import { normalizeDrama } from '../normalizers';
import { API_CODE, Episode } from '../types';
import { normalizePlaybackUrl } from '../url';

const BASE = '/api/reelife';

const toArray = (v: any): any[] => (Array.isArray(v) ? v : []);

const isDramaLike = (item: any) => {
  if (!item || typeof item !== 'object') return false;
  return Boolean(
    item.bookId ||
      item.id ||
      item.book_id ||
      item.bookID ||
      item.vid ||
      item.title ||
      item.bookName ||
      item.book_name ||
      item.name ||
      item.cover ||
      item.book_cover ||
      item.poster ||
      item.thumbnail
  );
};

const deepCollectDramaLike = (input: any, maxDepth = 8): any[] => {
  const out: any[] = [];
  const walk = (node: any, depth: number) => {
    if (!node || depth > maxDepth) return;
    if (Array.isArray(node)) {
      node.forEach((n) => walk(n, depth + 1));
      return;
    }
    if (typeof node !== 'object') return;
    if (isDramaLike(node)) out.push(node);
    Object.values(node).forEach((v) => {
      if (v && (Array.isArray(v) || typeof v === 'object')) walk(v, depth + 1);
    });
  };
  walk(input, 0);
  return out;
};

const dedupeDrama = (items: ReturnType<typeof normalizeDrama>[]) => {
  const seen = new Set<string>();
  const out: ReturnType<typeof normalizeDrama>[] = [];
  for (const item of items) {
    const key = item.id || item.bookId || `${item.title}-${item.poster}`;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
};

const normalizeReelifeList = (data: any) => {
  const payload = data?.data || data;

  const directCandidates = [
    payload?.list,
    payload?.records,
    payload?.items,
    payload?.books,
    payload?.bookList,
    payload?.results,
    payload?.contentInfos,
    data?.list,
    data?.records,
    data?.items,
    data?.results,
  ].find((arr) => Array.isArray(arr));

  if (Array.isArray(directCandidates) && directCandidates.length > 0) {
    return dedupeDrama(directCandidates.map((item) => normalizeDrama(item)));
  }

  // Handle section-based home payloads (rows/cards grouped per section)
  const sectionArrays = [
    payload?.sections,
    payload?.modules,
    payload?.rows,
    payload?.cell_data,
    payload?.cell?.cell_data,
    data?.sections,
    data?.modules,
  ].filter(Array.isArray);

  if (sectionArrays.length > 0) {
    const flattened = sectionArrays.flatMap((section: any[]) =>
      section.flatMap((s: any) => toArray(s?.books).concat(toArray(s?.list), toArray(s?.items), toArray(s?.records)))
    );
    if (flattened.length > 0) {
      return dedupeDrama(flattened.map((item) => normalizeDrama(item)));
    }
  }

  const deep = deepCollectDramaLike(data);
  return dedupeDrama(deep.map((item) => normalizeDrama(item)));
};

const toEpisodeList = (data: any): any[] => {
  const payload = data?.data || data;
  if (Array.isArray(payload?.chapters)) return payload.chapters;
  if (Array.isArray(payload?.chapter_list)) return payload.chapter_list;
  if (Array.isArray(payload?.chapterList)) return payload.chapterList;
  if (Array.isArray(payload?.episodes)) return payload.episodes;
  if (Array.isArray(payload?.episode_list)) return payload.episode_list;
  if (Array.isArray(payload?.list)) return payload.list;
  if (Array.isArray(payload?.records)) return payload.records;
  if (Array.isArray(payload)) return payload;
  return [];
};

const normalizeDuration = (duration: any) => {
  if (typeof duration === 'number' && Number.isFinite(duration)) {
    const totalSeconds = duration > 10_000 ? Math.floor(duration / 1000) : Math.floor(duration);
    const mins = Math.floor(totalSeconds / 60);
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }
  if (typeof duration === 'string' && duration.trim()) {
    const raw = duration.trim();
    if (/^\d+$/.test(raw)) {
      const value = Number(raw);
      const totalSeconds = value > 10_000 ? Math.floor(value / 1000) : value;
      const mins = Math.floor(totalSeconds / 60);
      const secs = (totalSeconds % 60).toString().padStart(2, '0');
      return `${mins}:${secs}`;
    }
    return raw;
  }
  return '';
};

const extractPlayableUrl = (data: any) => {
  if (typeof data === 'string') return normalizePlaybackUrl(data);
  return normalizePlaybackUrl(
    data?.data?.url ||
    data?.data?.playUrl ||
    data?.data?.play_url ||
    data?.data?.videoUrl ||
    data?.data?.video_url ||
    data?.data?.m3u8 ||
    data?.url ||
    data?.playUrl ||
    data?.play_url ||
    data?.videoUrl ||
    data?.video_url ||
    data?.m3u8 ||
    ''
  );
};

export const reelifeProvider = {
  async fetchHomepage(page = 1) {
    const { data } = await api.get(`${BASE}/home?page=${page}&lang=in`);
    const list = normalizeReelifeList(data);
    if (list.length > 0) return list;

    const browse = await api.get(`${BASE}/browse?page=${page}&letter=a&lang=in`).catch(() => null);
    if (browse?.data) {
      const browseList = normalizeReelifeList(browse.data);
      if (browseList.length > 0) return browseList;
    }

    return [];
  },
  async fetchTrending() {
    const { data } = await api.get(`${BASE}/rank?type=trending&lang=in`);
    const list = normalizeReelifeList(data);
    if (list.length > 0) return list;
    return this.fetchHomepage(1);
  },
  async fetchLatest() {
    const latestRes = await api.get(`${BASE}/rank?type=latest&lang=in`).catch(() => null);
    if (latestRes?.data) {
      const list = normalizeReelifeList(latestRes.data);
      if (list.length > 0) return list;
    }
    return this.fetchHomepage(2);
  },
  async fetchForYou() {
    return this.fetchHomepage(1);
  },
  async fetchVIP() {
    const rankRes = await api.get(`${BASE}/rank?type=popular&lang=in`).catch(() => null);
    if (rankRes?.data) {
      const list = normalizeReelifeList(rankRes.data);
      if (list.length > 0) return list;
    }
    return this.fetchHomepage(1);
  },
  async fetchDubIndo(page = 1, _classify?: string) {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    const letter = letters[(page - 1) % letters.length];
    const { data } = await api.get(`${BASE}/browse?page=${page}&letter=${letter}&lang=in`);
    const list = normalizeReelifeList(data);
    if (list.length > 0) return list;
    return this.fetchHomepage(page);
  },
  async fetchRandom() {
    const list = await this.fetchHomepage(1);
    return list.sort(() => Math.random() - 0.5);
  },
  async searchDrama(query: string) {
    const { data } = await api.get(`${BASE}/search?q=${query}&page=1&lang=in`);
    const list = normalizeReelifeList(data);
    if (list.length > 0) return list;
    const suggestRes = await api.get(`${BASE}/suggest?q=${query}&lang=in`).catch(() => null);
    if (!suggestRes?.data) return [];
    return normalizeReelifeList(suggestRes.data);
  },
  async fetchDetail(bookId: string) {
    const { data } = await api.get(`${BASE}/book/${bookId}?lang=in`);
    const detail = data?.data || data?.results || data;
    return normalizeDrama(detail);
  },
  async fetchVideoUrl(episodeId: string, bookId?: string) {
    if (!bookId) return '';
    const encodedEpisodeId = encodeURIComponent(String(episodeId));
    const tryPaths = [
      `${BASE}/play/${bookId}/${encodedEpisodeId}?code=${API_CODE}&lang=in`,
      `${BASE}/play/${bookId}/${episodeId}?code=${API_CODE}&lang=in`,
      `${BASE}/book/${bookId}/episode/${encodedEpisodeId}?preload=3&code=${API_CODE}&lang=in`,
      `${BASE}/book/${bookId}/episode/${episodeId}?preload=3&code=${API_CODE}&lang=in`,
    ];

    for (const path of tryPaths) {
      const res = await api.get(path).catch(() => null);
      const playable = res?.data ? normalizePlaybackUrl(extractPlayableUrl(res.data)) : '';
      if (playable) return playable;
    }

    return '';
  },
  async fetchEpisodes(bookId: string): Promise<Episode[]> {
    const { data } = await api.get(`${BASE}/book/${bookId}/chapters?lang=in`);
    const episodes = toEpisodeList(data);

    const mapped = episodes.map((ep: any, index: number) => {
      const episodeNo = Number(ep?.episode || ep?.chapter || ep?.sort || ep?.id || index + 1);
      const normalizedEpisode = Number.isFinite(episodeNo) && episodeNo > 0 ? episodeNo : index + 1;
      const rawEpisodeId =
        ep?.id ||
        ep?.episodeId ||
        ep?.episode_id ||
        ep?.chapterId ||
        ep?.chapter_id ||
        ep?.vid ||
        ep?.videoId;
      const resolvedEpisodeId = String(rawEpisodeId || normalizedEpisode);
      return {
        ...ep,
        id: resolvedEpisodeId,
        title: ep?.title || ep?.name || ep?.episodeName || ep?.chapterName || ep?.shortPlayName || `Episode ${normalizedEpisode}`,
        duration: normalizeDuration(
          ep?.duration ||
          ep?.time ||
          ep?.videoDuration ||
          ep?.video_duration ||
          ep?.timeLength ||
          ep?.playTime ||
          ep?.play_time ||
          ep?.seconds ||
          ep?.length ||
          ep?.totalDuration
        ),
        url: `${BASE}/play/${bookId}/${encodeURIComponent(resolvedEpisodeId)}?code=${API_CODE}&lang=in`,
      };
    });

    return mapped.sort((a, b) => {
      const episodeA = Number((a as any)?.episode || (a as any)?.chapter || (a as any)?.sort || 0);
      const episodeB = Number((b as any)?.episode || (b as any)?.chapter || (b as any)?.sort || 0);
      return episodeA - episodeB;
    });
  },
};


