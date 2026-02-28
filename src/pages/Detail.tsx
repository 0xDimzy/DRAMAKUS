import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { Play, Plus, Check, ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { fetchDetail, fetchEpisodes, Drama, Episode } from '../lib/api';
import { useStore } from '../store/useStore';

export default function Detail() {
  const { id } = useParams<{ id: string }>();
  const decodedId = id ? decodeURIComponent(id) : '';
  const navigate = useNavigate();
  const location = useLocation();
  const [drama, setDrama] = useState<Drama | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToList, removeFromList, isInList, continueWatching, myList, platform, user } = useStore();
  const isInvalidDramaTitle = (title: string | undefined | null) => {
    const normalized = String(title || '').trim();
    if (!normalized) return true;
    if (normalized === 'Unknown Title') return true;
    if (normalized === decodedId) return true;
    if (/^\d{8,}$/.test(normalized)) return true;
    return false;
  };
  const isUsablePoster = (poster: string | undefined | null) => {
    const normalized = String(poster || '').trim();
    if (!normalized) return false;
    if (normalized.includes('/images/placeholder-')) return false;
    if (normalized.includes('Poster Unavailable')) return false;
    return true;
  };
  
  const isAdded = decodedId ? isInList(decodedId) : false;
  const userKey = user?.email?.toLowerCase() || 'guest';
  const continueEntry = continueWatching[userKey]?.[`${platform}:${decodedId}`];
  const myListEntry = myList.find(
    (item) => (item.bookId || item.id) === decodedId && ((item as any)?._platform || 'dramabox') === platform
  );
  const stateDrama = (location.state as any)?.drama as Drama | undefined;
  const episodeCountLabel =
    drama?.total_episode && drama.total_episode !== '0'
      ? `${drama.total_episode} Eps`
      : episodes.length > 0
        ? `${episodes.length} Eps`
        : 'Belum tersedia';

  useEffect(() => {
    const loadData = async () => {
      if (!decodedId) return;
      try {
        const [dramaData, episodesData] = await Promise.all([
          fetchDetail(decodedId),
          fetchEpisodes(decodedId)
        ]);
        const fallbackTitle =
          (!isInvalidDramaTitle(stateDrama?.title) ? String(stateDrama?.title).trim() : '') ||
          (!isInvalidDramaTitle(continueEntry?.dramaTitle) ? String(continueEntry?.dramaTitle).trim() : '') ||
          (!isInvalidDramaTitle(myListEntry?.title) ? String(myListEntry?.title).trim() : '') ||
          'Tanpa Judul';
        const fallbackPoster =
          (isUsablePoster(stateDrama?.poster) ? stateDrama?.poster : '') ||
          (isUsablePoster(continueEntry?.dramaPoster) ? continueEntry?.dramaPoster : '') ||
          (isUsablePoster(myListEntry?.poster) ? myListEntry?.poster : '') ||
          '/images/placeholder-poster.svg';

        const safeDrama = dramaData
          ? {
              ...dramaData,
              title: !isInvalidDramaTitle(dramaData.title) ? dramaData.title : fallbackTitle,
              poster: isUsablePoster(dramaData.poster) ? dramaData.poster : fallbackPoster,
            }
          : {
              id: decodedId,
              bookId: decodedId,
              title: fallbackTitle,
              poster: fallbackPoster,
            };

        setDrama(safeDrama);
        setEpisodes(episodesData);
      } catch (error) {
        console.error('Failed to load detail', error);
        const fallbackTitle =
          (!isInvalidDramaTitle(stateDrama?.title) ? String(stateDrama?.title).trim() : '') ||
          (!isInvalidDramaTitle(continueEntry?.dramaTitle) ? String(continueEntry?.dramaTitle).trim() : '') ||
          (!isInvalidDramaTitle(myListEntry?.title) ? String(myListEntry?.title).trim() : '') ||
          'Tanpa Judul';
        const fallbackPoster =
          (isUsablePoster(stateDrama?.poster) ? stateDrama?.poster : '') ||
          (isUsablePoster(continueEntry?.dramaPoster) ? continueEntry?.dramaPoster : '') ||
          (isUsablePoster(myListEntry?.poster) ? myListEntry?.poster : '') ||
          '/images/placeholder-poster.svg';
        setDrama({
          id: decodedId,
          bookId: decodedId,
          title: fallbackTitle,
          poster: fallbackPoster,
        });
      } finally {
        setLoading(false);
      }
    };
    loadData();
    window.scrollTo(0, 0);
  }, [decodedId, continueEntry?.dramaPoster, continueEntry?.dramaTitle, myListEntry?.poster, myListEntry?.title, stateDrama?.poster, stateDrama?.title]);

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
  }

  if (!drama) return null;

  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col">
      <Navbar />
      
      <div className="flex-grow">
        {/* Hero Section */}
        <div className="relative h-[72vh] sm:h-[56vh] md:h-[60vh] w-full">
          <div className="absolute inset-0 pointer-events-none">
            <img
              src={drama.poster}
              alt={drama.title}
              className="w-full h-full object-cover opacity-50"
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.src.includes('/images/placeholder-hero.svg')) {
                  target.src = '/images/placeholder-hero.svg';
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />
          </div>
          
          <div className="absolute bottom-0 left-0 z-10 w-full max-w-4xl p-4 sm:p-8 md:p-12 pointer-events-auto">
            <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold mb-4">{drama.title}</h1>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-6 text-xs sm:text-sm md:text-base text-gray-300">
              <span className="text-green-400 font-bold">98% Match</span>
              <span>{drama.release_date}</span>
              <span className="border border-gray-500 px-1 text-xs">HD</span>
              <span>{episodeCountLabel}</span>
              <span>{drama.genre}</span>
            </div>

            <div className="mb-6 flex flex-wrap gap-3">
              <Link
                to={`/watch/${encodeURIComponent(decodedId)}`}
                state={{
                  drama: {
                    id: drama.id || decodedId,
                    bookId: drama.bookId || decodedId,
                    title: drama.title,
                    poster: drama.poster,
                  },
                }}
                className="w-full sm:w-auto min-h-11 touch-manipulation active:scale-95 flex items-center justify-center px-6 py-3 bg-white text-black rounded font-bold hover:bg-gray-200 transition"
              >
                <Play className="w-5 h-5 mr-2 fill-black" />
                Play
              </Link>
              <button
                type="button"
                onClick={() => navigate('/home')}
                className="w-full sm:w-auto min-h-11 touch-manipulation active:scale-95 flex items-center justify-center px-6 py-3 bg-gray-500/80 text-white rounded font-bold hover:bg-gray-500 transition"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Kembali
              </button>
              <button
                type="button"
                onClick={() => isAdded ? removeFromList(drama.bookId || drama.id) : addToList(drama)}
                className="w-full sm:w-auto min-h-11 touch-manipulation active:scale-95 flex items-center justify-center px-6 py-3 bg-gray-600/80 text-white rounded font-bold hover:bg-gray-600 transition"
              >
                {isAdded ? <Check className="w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
                My List
              </button>
            </div>

            <p className="text-gray-300 text-sm sm:text-lg line-clamp-3 max-w-2xl">{drama.description}</p>
          </div>
        </div>

        {/* Episodes Section */}
        <div className="px-8 md:px-12 py-8">
          <h2 className="text-2xl font-bold mb-6">Episodes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {episodes.map((ep, index) => (
              <Link
                key={`${ep.id}-${index}`}
                to={`/watch/${encodeURIComponent(decodedId)}?ep=${encodeURIComponent(ep.id)}`}
                state={{
                  drama: {
                    id: drama.id || decodedId,
                    bookId: drama.bookId || decodedId,
                    title: drama.title,
                    poster: drama.poster,
                  },
                }}
                className="flex items-center p-4 bg-[#2f2f2f] rounded hover:bg-[#404040] transition group"
              >
                <div className="mr-4 text-gray-400 font-bold text-xl group-hover:text-white">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm md:text-base">{ep.title}</h3>
                  <p className="text-xs text-gray-400">Durasi: {ep.duration || 'Belum tersedia'}</p>
                </div>
                <Play className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition" />
              </Link>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
