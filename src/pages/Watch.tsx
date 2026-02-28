import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, SkipBack, SkipForward, List } from 'lucide-react';
import VideoPlayer from '../components/VideoPlayer';
import { fetchEpisodes, fetchVideoUrl, fetchDetail, Episode, Drama } from '../lib/api';
import { normalizePlaybackUrl } from '../lib/api/url';
import { useStore } from '../store/useStore';

export default function Watch() {
  const { id } = useParams<{ id: string }>();
  const decodedId = id ? decodeURIComponent(id) : '';
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const episodeId = searchParams.get('ep');
  const decodedEpisodeId = episodeId ? decodeURIComponent(episodeId) : null;
  const { platform, user, continueWatching, updateProgress } = useStore();
  const stateDrama = (location.state as any)?.drama as Drama | undefined;
  const isInvalidDramaTitle = (title: string | undefined | null) => {
    const normalized = String(title || '').trim();
    if (!normalized) return true;
    if (normalized === 'Unknown Title') return true;
    if (normalized === decodedId) return true;
    if (/^\d{8,}$/.test(normalized)) return true;
    return false;
  };

  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [resumeSeconds, setResumeSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showMobileEpisodeNav, setShowMobileEpisodeNav] = useState(true);
  const [dramaInfo, setDramaInfo] = useState<Drama | null>(null);
  const lastSavedSecondRef = useRef(0);
  const mobileNavHideTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const loadEpisodes = async () => {
      if (!decodedId || !user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setLoadError(null);
      try {
        const [data, detail] = await Promise.all([
          fetchEpisodes(decodedId),
          fetchDetail(decodedId).catch(() => null),
        ]);
        setDramaInfo(detail);
        setEpisodes(data);

        if (data.length > 0) {
          const ep = decodedEpisodeId ? data.find((e: Episode) => e.id === decodedEpisodeId) : data[0];
          const selectedEp = ep || data[0];
          setCurrentEpisode(selectedEp);
          const userKey = user?.email?.toLowerCase() || 'guest';
          const existingEntry = continueWatching[userKey]?.[`${platform}:${decodedId}`];
          const canResumeSameEpisode = existingEntry && String(existingEntry.episodeId) === String(selectedEp.id);
          setResumeSeconds(canResumeSameEpisode ? Math.max(0, Math.floor(existingEntry.progress || 0)) : 0);

          if (platform === 'melolo' || platform === 'netshort' || platform === 'reelife') {
            setVideoLoading(true);
            try {
              const url = await fetchVideoUrl(selectedEp.id, decodedId);
              setVideoUrl(normalizePlaybackUrl(url || selectedEp.url || ''));
            } catch (error) {
              console.error('Failed to fetch direct video URL, using episode fallback URL', error);
              setVideoUrl(normalizePlaybackUrl(selectedEp.url || ''));
            } finally {
              setVideoLoading(false);
            }
          } else {
            setVideoUrl(normalizePlaybackUrl(selectedEp.url));
          }
        } else {
          setLoadError('Episode tidak tersedia untuk drama ini.');
        }
      } catch (error) {
        console.error('Failed to load episodes', error);
        setLoadError('Gagal memuat episode. Coba refresh halaman.');
      } finally {
        setLoading(false);
      }
    };
    loadEpisodes();
  }, [decodedId, decodedEpisodeId, platform, user]);

  useEffect(() => {
    lastSavedSecondRef.current = 0;
  }, [currentEpisode?.id]);

  useEffect(() => {
    return () => {
      if (mobileNavHideTimeoutRef.current) {
        window.clearTimeout(mobileNavHideTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.innerWidth >= 640) return;
    revealMobileEpisodeNav();
  }, [currentEpisode?.id]);

  const revealMobileEpisodeNav = () => {
    setShowMobileEpisodeNav(true);
    if (mobileNavHideTimeoutRef.current) {
      window.clearTimeout(mobileNavHideTimeoutRef.current);
    }
    mobileNavHideTimeoutRef.current = window.setTimeout(() => {
      setShowMobileEpisodeNav(false);
    }, 2500);
  };

  const handleNextEpisode = () => {
    if (!currentEpisode || !episodes.length || !decodedId) return;
    const currentIndex = episodes.findIndex((e) => e.id === currentEpisode.id);
    if (currentIndex < episodes.length - 1) {
      const nextEp = episodes[currentIndex + 1];
      navigate(`/watch/${encodeURIComponent(decodedId)}?ep=${encodeURIComponent(nextEp.id)}`);
    }
  };

  const handlePreviousEpisode = () => {
    if (!currentEpisode || !episodes.length || !decodedId) return;
    const currentIndex = episodes.findIndex((e) => e.id === currentEpisode.id);
    if (currentIndex > 0) {
      const prevEp = episodes[currentIndex - 1];
      navigate(`/watch/${encodeURIComponent(decodedId)}?ep=${encodeURIComponent(prevEp.id)}`);
    }
  };

  const handleProgress = (state: { playedSeconds: number; played: number }) => {
    if (!decodedId || !currentEpisode) return;

    const currentSecond = Math.floor(state.playedSeconds || 0);
    if (currentSecond < 1) return;
    if (currentSecond - lastSavedSecondRef.current < 1) return;
    lastSavedSecondRef.current = currentSecond;

    const userKey = user?.email?.toLowerCase() || 'guest';
    const existingEntry = continueWatching[userKey]?.[`${platform}:${decodedId}`];
    const safeTitle =
      !isInvalidDramaTitle(stateDrama?.title)
        ? String(stateDrama?.title).trim()
        : !isInvalidDramaTitle(dramaInfo?.title)
        ? String(dramaInfo?.title).trim()
        : !isInvalidDramaTitle(existingEntry?.dramaTitle)
          ? String(existingEntry?.dramaTitle).trim()
          : 'Tanpa Judul';

    const fallbackDrama: Drama = {
      id: decodedId,
      bookId: decodedId,
      title: safeTitle,
      poster: stateDrama?.poster || dramaInfo?.poster || existingEntry?.dramaPoster || '/images/placeholder-poster.svg',
    };

    const normalizedDrama: Drama = {
      ...(dramaInfo || {}),
      id: decodedId,
      bookId: decodedId,
      title: safeTitle,
      poster: fallbackDrama.poster,
    };

    const episodeIndex = episodes.findIndex((e) => String(e.id) === String(currentEpisode.id));
    const episodeNo = episodeIndex >= 0 ? episodeIndex + 1 : undefined;
    updateProgress(normalizedDrama, currentEpisode.id, currentSecond, platform, episodeNo);
  };

  const getBackDramaState = (): Drama => {
    const userKey = user?.email?.toLowerCase() || 'guest';
    const existingEntry = continueWatching[userKey]?.[`${platform}:${decodedId}`];
    const safeTitle =
      !isInvalidDramaTitle(stateDrama?.title)
        ? String(stateDrama?.title).trim()
        : !isInvalidDramaTitle(dramaInfo?.title)
        ? String(dramaInfo?.title).trim()
        : !isInvalidDramaTitle(existingEntry?.dramaTitle)
          ? String(existingEntry?.dramaTitle).trim()
          : 'Tanpa Judul';

    return {
      id: decodedId,
      bookId: decodedId,
      title: safeTitle,
      poster: stateDrama?.poster || dramaInfo?.poster || existingEntry?.dramaPoster || '/images/placeholder-poster.svg',
    };
  };

  if (!user) {
    return (
      <div className="bg-black h-screen flex items-center justify-center text-white px-4">
        <div className="max-w-md text-center">
          <p className="text-2xl font-bold mb-3">Login Dibutuhkan</p>
          <p className="text-gray-400 mb-6">Untuk menonton film, silakan login Google terlebih dahulu dari menu profil.</p>
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="px-6 py-3 bg-red-600 rounded-md hover:bg-red-700 transition font-semibold"
          >
            Kembali ke Home
          </button>
        </div>
      </div>
    );
  }

  if (loading) return <div className="bg-black h-screen flex items-center justify-center text-white">Loading...</div>;
  if (loadError) return <div className="bg-black h-screen flex items-center justify-center text-white px-4 text-center">{loadError}</div>;
  if (!currentEpisode) return <div className="bg-black h-screen flex items-center justify-center text-white">Episode not found</div>;
  const currentEpisodeIndex = episodes.findIndex((e) => e.id === currentEpisode.id);
  const hasPrevious = currentEpisodeIndex > 0;
  const hasNext = currentEpisodeIndex < episodes.length - 1;

  return (
    <div
      className="relative h-screen w-full bg-black overflow-hidden group"
      onTouchStart={revealMobileEpisodeNav}
      onClick={revealMobileEpisodeNav}
    >
      <button
        onClick={() => navigate(`/detail/${encodeURIComponent(decodedId)}`, { state: { drama: getBackDramaState() } })}
        className="absolute top-4 left-4 z-50 flex items-center gap-2 px-4 py-2 bg-black/60 rounded-full text-white hover:bg-white/20 transition"
      >
        <ArrowLeft className="w-6 h-6" />
        <span className="text-sm font-semibold">Kembali</span>
      </button>

      {videoLoading ? (
        <div className="flex flex-col items-center justify-center h-full text-white space-y-4">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          <p>Fetching video link...</p>
        </div>
      ) : videoUrl ? (
        <VideoPlayer
          url={videoUrl}
          startSeconds={resumeSeconds}
          onEnded={handleNextEpisode}
          onProgress={handleProgress}
        />
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-white space-y-4">
          <p className="text-xl font-bold">Video URL not found</p>
          <p className="text-gray-400">This episode might not be available yet.</p>
          <button
            onClick={() =>
              navigate(`/detail/${encodeURIComponent(decodedId)}`, { state: { drama: getBackDramaState() } })
            }
            className="px-6 py-2 bg-red-600 rounded-full hover:bg-red-700 transition"
          >
            Go Back
          </button>
        </div>
      )}

      <div className="absolute top-16 left-4 z-40 rounded-md bg-black/60 px-3 py-2 text-xs text-white">
        <p className="font-semibold">Episode: {currentEpisode.title}</p>
      </div>

      <button
        onClick={() => {
          setShowSidebar(!showSidebar);
          revealMobileEpisodeNav();
        }}
        className="absolute top-4 right-4 z-50 p-2 bg-black/50 rounded-full text-white hover:bg-white/20 transition opacity-100 md:opacity-0 md:group-hover:opacity-100"
      >
        <List className="w-6 h-6" />
      </button>

      <div
        className={`absolute top-0 right-0 h-full w-80 bg-black/90 backdrop-blur-md transform transition-transform duration-300 z-40 overflow-y-auto ${
          showSidebar ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4">
          <h2 className="text-xl font-bold text-white mb-4">Episodes</h2>
          <div className="space-y-2">
            {episodes.map((ep, index) => (
              <button
                key={`${ep.id}-${index}`}
                onClick={() => {
                  navigate(`/watch/${encodeURIComponent(decodedId)}?ep=${encodeURIComponent(ep.id)}`);
                  setShowSidebar(false);
                }}
                className={`w-full text-left p-3 rounded flex items-center space-x-3 transition ${
                  currentEpisode.id === ep.id ? 'bg-red-600 text-white' : 'hover:bg-gray-800 text-gray-300'
                }`}
              >
                <span className="text-lg font-bold w-6">{index + 1}</span>
                <div className="flex-1">
                  <h4 className="text-sm font-medium line-clamp-1">{ep.title}</h4>
                </div>
                {currentEpisode.id === ep.id && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        className={`fixed inset-x-0 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-50 px-3 sm:hidden pointer-events-none transition-all duration-300 ${
          showMobileEpisodeNav && !showSidebar ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0 pointer-events-none'
        }`}
      >
        <div className="mx-auto grid w-full max-w-md grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              handlePreviousEpisode();
              revealMobileEpisodeNav();
            }}
            disabled={!hasPrevious}
            className="pointer-events-auto w-full rounded-md border border-red-500/40 bg-red-600/90 px-3 py-2 text-sm font-bold text-white shadow-lg transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => {
              handleNextEpisode();
              revealMobileEpisodeNav();
            }}
            disabled={!hasNext}
            className="pointer-events-auto w-full rounded-md border border-red-500/40 bg-red-600/90 px-3 py-2 text-sm font-bold text-white shadow-lg transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {hasPrevious && (
        <button
          onClick={handlePreviousEpisode}
          className="absolute bottom-20 left-8 z-50 hidden px-6 py-3 bg-white text-black font-bold rounded sm:flex items-center space-x-2 hover:bg-gray-200 transition opacity-100 md:opacity-0 md:group-hover:opacity-100"
        >
          <SkipBack className="w-5 h-5" />
          <span>Previous Episode</span>
        </button>
      )}

      {hasNext && (
        <button
          onClick={handleNextEpisode}
          className="absolute bottom-20 right-8 z-50 hidden px-6 py-3 bg-white text-black font-bold rounded sm:flex items-center space-x-2 hover:bg-gray-200 transition opacity-100 md:opacity-0 md:group-hover:opacity-100"
        >
          <span>Next Episode</span>
          <SkipForward className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
