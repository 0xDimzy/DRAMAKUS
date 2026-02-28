import { useNavigate } from 'react-router-dom';
import { Play, Plus, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { Drama } from '../lib/api';
import { useStore } from '../store/useStore';

interface MovieCardProps {
  drama: Drama;
  showMeta?: boolean;
}

export default function MovieCard({ drama, showMeta = true }: MovieCardProps) {
  const navigate = useNavigate();
  const { addToList, removeFromList, isInList } = useStore();
  const dramaId = drama.bookId || drama.id;
  const isAdded = isInList(dramaId);
  const rawDrama = drama as any;
  const hasApiNewFlag = [rawDrama.is_new, rawDrama.isNew, rawDrama.new, rawDrama.is_latest, rawDrama.isLatest].some(
    (value) => value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true'
  );
  const parseReleaseDate = (value: any) => {
    const raw = String(value || '').trim();
    if (!raw) return null;
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed;
    const normalized = raw.replace(/\./g, '-').replace(/\//g, '-');
    const fallback = new Date(normalized);
    if (!Number.isNaN(fallback.getTime())) return fallback;
    return null;
  };
  const releaseDate = parseReleaseDate(drama.release_date || rawDrama.releaseDate || rawDrama.release_date);
  const isRecentlyReleased =
    !!releaseDate && Date.now() - releaseDate.getTime() >= 0 && Date.now() - releaseDate.getTime() <= 1000 * 60 * 60 * 24 * 45;
  const showNewBadge = hasApiNewFlag || isRecentlyReleased;
  const resolvedEpisode =
    drama.total_episode ||
    rawDrama.totalEpisode ||
    rawDrama.totalEpisodes ||
    rawDrama.episodeCount ||
    rawDrama.episode_count ||
    rawDrama.episodesCount ||
    rawDrama.episodes_count ||
    rawDrama.chapterCount ||
    rawDrama.chapter_count ||
    rawDrama.shortPlayEpisodeCount ||
    rawDrama.videoCount ||
    '';
  const resolvedDuration =
    rawDrama.totalDuration ||
    rawDrama.total_duration ||
    rawDrama.totalTime ||
    rawDrama.total_time ||
    rawDrama.totalPlayTime ||
    rawDrama.total_play_time ||
    rawDrama.fullDuration ||
    rawDrama.full_duration ||
    rawDrama.videoDuration ||
    rawDrama.video_duration ||
    rawDrama.timeLength ||
    rawDrama.playTime ||
    rawDrama.play_time ||
    rawDrama.durationText ||
    drama.duration ||
    '';

  const episodeLabel =
    String(resolvedEpisode).trim() && String(resolvedEpisode) !== '0' ? `${resolvedEpisode} Eps` : 'Belum tersedia';
  const durationLabel =
    String(resolvedDuration).trim() && String(resolvedDuration) !== '0' ? String(resolvedDuration) : 'Belum tersedia';

  const handleListToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAdded) {
      removeFromList(dramaId);
    } else {
      addToList(drama);
    }
  };

  const handleCardClick = () => {
    navigate(`/detail/${encodeURIComponent(dramaId)}`, { state: { drama } });
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/detail/${encodeURIComponent(dramaId)}`, { state: { drama } });
  };

  return (
    <motion.div
      className="relative w-full cursor-pointer transition duration-200 ease-out md:hover:scale-105 group"
      onClick={handleCardClick}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md shadow-lg">
        <img
          src={drama.poster}
          alt={drama.title}
          className="object-cover w-full h-full absolute inset-0 transition-transform duration-300 group-hover:scale-110"
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (!target.src.includes('/images/placeholder-poster.svg')) {
              target.src = '/images/placeholder-poster.svg';
            }
          }}
        />

        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center space-x-3">
          <button
            onClick={handlePlayClick}
            className="bg-red-600 rounded-full p-3 hover:bg-red-700 transition transform hover:scale-110"
          >
            <Play className="h-5 w-5 text-white fill-white" />
          </button>
          <button
            onClick={handleListToggle}
            className="bg-white/20 backdrop-blur-md border border-white/30 rounded-full p-3 hover:bg-white/40 transition transform hover:scale-110"
          >
            {isAdded ? <Check className="h-5 w-5 text-white" /> : <Plus className="h-5 w-5 text-white" />}
          </button>
        </div>

        {showNewBadge && (
          <div className="absolute top-2 right-2">
            <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider shadow-md">
              New
            </span>
          </div>
        )}
      </div>

      <div className="mt-3">
        <h3 className="text-white font-semibold text-sm md:text-base line-clamp-1 group-hover:text-red-500 transition-colors">
          {drama.title}
        </h3>
        {showMeta && (
          <>
            <p className="text-gray-400 text-xs mt-1">Total Episode: {episodeLabel}</p>
            <p className="text-gray-400 text-xs mt-1">Total Durasi: {durationLabel}</p>
          </>
        )}
      </div>
    </motion.div>
  );
}
