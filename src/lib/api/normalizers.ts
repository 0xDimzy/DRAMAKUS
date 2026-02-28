import { Drama } from './types';

const EMPTY_POSTER = '/images/placeholder-poster.svg';

const toArray = (value: any): any[] => (Array.isArray(value) ? value : []);

const DRAMA_ID_KEYS = ['bookId', 'id', 'book_id', 'vid', 'dramaId', 'drama_id', 'bookID', 'shortPlayId'];
const DRAMA_TITLE_KEYS = [
  'title',
  'bookName',
  'name',
  'book_name',
  'book_title',
  'dramaName',
  'drama_name',
  'dramaTitle',
  'drama_title',
  'shortPlayName',
  'episodeName',
];
const DRAMA_IMAGE_KEYS = [
  'thumb_url',
  'cover',
  'coverUrl',
  'cover_url',
  'coverWap',
  'cover_wap',
  'coverHorizontal',
  'cover_horizontal',
  'coverVertical',
  'cover_vertical',
  'bookCover',
  'book_cover',
  'poster',
  'posterUrl',
  'poster_url',
  'thumb',
  'thumbnail',
  'image',
  'img',
  'book_img',
  'bookImg',
  'vertical_cover',
  'horizontal_cover',
  'book_cover_wap',
  'bookCoverWap',
  'shortPlayCover',
  'highImage',
];

const hasAnyKey = (item: any, keys: string[]) => keys.some((key) => item?.[key] !== undefined && item?.[key] !== null);

const isDramaCandidate = (item: any) => {
  if (!item || typeof item !== 'object') return false;
  const hasTitleOrImage = hasAnyKey(item, DRAMA_TITLE_KEYS) || hasAnyKey(item, DRAMA_IMAGE_KEYS);
  return hasTitleOrImage;
};

const collectDramaCandidatesDeep = (input: any, maxDepth = 8): any[] => {
  const out: any[] = [];
  const walk = (node: any, depth: number) => {
    if (depth > maxDepth || !node) return;
    if (Array.isArray(node)) {
      node.forEach((child) => walk(child, depth + 1));
      return;
    }
    if (typeof node !== 'object') return;

    if (isDramaCandidate(node)) {
      out.push(node);
    }

    for (const value of Object.values(node)) {
      if (value && (Array.isArray(value) || typeof value === 'object')) {
        walk(value, depth + 1);
      }
    }
  };

  walk(input, 0);
  return out;
};

const dedupeDramas = (items: Drama[]) => {
  const seen = new Set<string>();
  const filtered: Drama[] = [];

  for (const item of items) {
    const id = item.id || item.bookId || '';
    const key = id || `${item.title}-${item.poster}`;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    filtered.push(item);
  }
  return filtered;
};

const formatDuration = (value: any): string => {
  if (value === null || value === undefined) return '';

  if (typeof value === 'number' && Number.isFinite(value)) {
    const totalSeconds = Math.max(0, Math.floor(value));
    const mins = Math.floor(totalSeconds / 60);
    const secs = String(totalSeconds % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  }

  const raw = String(value).trim();
  if (!raw) return '';

  // If API sends pure numeric string, treat as seconds.
  if (/^\d+$/.test(raw)) {
    const totalSeconds = Number(raw);
    const mins = Math.floor(totalSeconds / 60);
    const secs = String(totalSeconds % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  }

  return raw;
};

const normalizeEpisodeCount = (value: any): string => {
  if (value === null || value === undefined) return '';
  const raw = String(value).trim();
  if (!raw) return '';
  if (/^\d+(\.0+)?$/.test(raw)) return String(Math.floor(Number(raw)));
  return raw;
};

export const normalizeDrama = (item: any): Drama => {
  if (!item) return {} as Drama;

  const title =
    item.title ||
    item.bookName ||
    item.name ||
    item.book_name ||
    item.book_title ||
    item.dramaName ||
    item.drama_name ||
    item.dramaTitle ||
    item.drama_title ||
    item.shortPlayName ||
    'Unknown Title';

  const poster = [
    item.thumb_url,
    item.cover,
    item.coverUrl,
    item.cover_url,
    item.coverWap,
    item.cover_wap,
    item.coverHorizontal,
    item.cover_horizontal,
    item.coverVertical,
    item.cover_vertical,
    item.bookCover,
    item.book_cover,
    item.poster,
    item.posterUrl,
    item.poster_url,
    item.thumb,
    item.thumbnail,
    item.image,
    item.img,
    item.book_img,
    item.bookImg,
    item.vertical_cover,
    item.horizontal_cover,
    item.book_cover_wap,
    item.bookCoverWap,
    item.shortPlayCover,
    item.highImage,
  ].find(
    (img) =>
      typeof img === 'string' &&
      img.trim().length > 0 &&
      !img.includes('null') &&
      !img.includes('undefined')
  ) || EMPTY_POSTER;

  const fallbackIdSeed = `${title}-${poster}`.replace(/\s+/g, '-').toLowerCase();
  const id = String(
    item.bookId ||
      item.id ||
      item.book_id ||
      item.vid ||
      item.dramaId ||
      item.drama_id ||
      item.bookID ||
      item.shortPlayId ||
      fallbackIdSeed
  );

  return {
    ...item,
    id,
    bookId: id,
    title,
    poster,
    duration: formatDuration(
      item.duration ||
        item.time ||
        item.videoDuration ||
        item.video_duration ||
        item.durationText ||
        item.timeLength ||
        item.playTime ||
        item.play_time ||
        item.totalDuration ||
        item.total_duration ||
        item.minutes ||
        item.minute ||
        item.video_time ||
        ''
    ),
    total_episode: normalizeEpisodeCount(
      item.total_episode ||
        item.totalEpisode ||
        item.episode_count ||
        item.episodeCount ||
        item.episodes_count ||
        item.episodesCount ||
        item.chapter_count ||
        item.chapterCount ||
        item.shortPlayEpisodeCount ||
        item.shortPlayCount ||
        item.videosCount ||
        item.videoCount ||
        item.video_count ||
        item.countEpisode ||
        item.totalChapters ||
        item.total_chapters ||
        item.chapterTotal ||
        ''
    ),
    description:
      item.abstract ||
      item.introduction ||
      item.description ||
      item.intro ||
      item.summary ||
      item.book_intro ||
      '',
  };
};

export const normalizeDramaboxList = (data: any): Drama[] => {
  let rawList: any[] = [];

  if (toArray(data?.recommendList?.records).length > 0) {
    rawList = data.recommendList.records;
  } else if (toArray(data?.results).length > 0) {
    rawList = data.results;
  } else if (toArray(data?.data).length > 0) {
    rawList = data.data;
  } else if (toArray(data?.records).length > 0) {
    rawList = data.records;
  } else if (toArray(data).length > 0) {
    rawList = data;
  }

  return dedupeDramas(rawList.map(normalizeDrama));
};

export const normalizeMeloloList = (data: any): Drama[] => {
  if (toArray(data?.data?.cell?.cell_data).length > 0) {
    const flattened = data.data.cell.cell_data.flatMap((cell: any) => toArray(cell?.books));
    return dedupeDramas(flattened.map(normalizeDrama));
  }

  return normalizeDramaboxList(data);
};

export const normalizeNetshortList = (data: any): Drama[] => {
  let rawList: any[] = [];

  if (toArray(data?.data?.list).length > 0) rawList = data.data.list;
  else if (toArray(data?.data?.contentInfos).length > 0) rawList = data.data.contentInfos;
  else if (toArray(data?.data?.records).length > 0) rawList = data.data.records;
  else if (toArray(data?.data?.items).length > 0) rawList = data.data.items;
  else if (toArray(data?.results).length > 0) rawList = data.results;
  else if (toArray(data?.data).length > 0) rawList = data.data;
  else if (toArray(data?.list).length > 0) rawList = data.list;
  else if (toArray(data?.records).length > 0) rawList = data.records;
  else if (toArray(data?.items).length > 0) rawList = data.items;
  else {
    const sectionArrays = [
      data?.data?.modules,
      data?.data?.moduleList,
      data?.data?.sections,
      data?.data?.cell_data,
      data?.modules,
      data?.sections,
    ].filter(Array.isArray);

    if (sectionArrays.length > 0) {
      rawList = sectionArrays.flatMap((section: any[]) =>
        section.flatMap((s: any) => s?.list || s?.items || s?.records || s?.books || s?.videos || s?.dramas || [])
      );
    } else if (toArray(data).length > 0) {
      rawList = data;
    }
  }

  if (rawList.length === 0) {
    rawList = collectDramaCandidatesDeep(data);
  }

  const normalized = rawList
    .map((item) => item?.drama || item?.book || item?.video || item)
    .map(normalizeDrama)
    .filter((item) => Boolean(item.title || item.poster));

  return dedupeDramas(normalized);
};
