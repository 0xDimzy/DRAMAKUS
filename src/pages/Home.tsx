import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import MovieCard from '../components/MovieCard';
import Footer from '../components/Footer';
import { fetchHomepage, Drama } from '../lib/api';
import { useStore } from '../store/useStore';

export default function Home() {
  const navigate = useNavigate();
  const { platform, getContinueWatchingForCurrentUser } = useStore();
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogMovies, setCatalogMovies] = useState<Drama[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [platformLoading, setPlatformLoading] = useState(false);
  const [catalogHasMore, setCatalogHasMore] = useState(true);
  const [sortBy, setSortBy] = useState<'latest' | 'az' | 'za'>('latest');

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      setPlatformLoading(true);
      setCatalogLoading(true);
      const startedAt = Date.now();
      try {
        const data = await fetchHomepage(1);
        if (!mounted) return;
        setCatalogMovies(data);
        setCatalogPage(1);
        setCatalogHasMore(data.length > 0);
      } catch (error) {
        console.error('Failed to load home catalog', error);
        if (mounted) {
          setCatalogMovies([]);
          setCatalogHasMore(false);
        }
      } finally {
        const elapsed = Date.now() - startedAt;
        const minLoadingMs = 550;
        const waitMs = Math.max(0, minLoadingMs - elapsed);
        setTimeout(() => {
          if (!mounted) return;
          setCatalogLoading(false);
          setPlatformLoading(false);
        }, waitMs);
      }
    };
    init();

    return () => {
      mounted = false;
    };
  }, [platform]);

  const sortedCatalogMovies = useMemo(() => {
    const list = [...catalogMovies];
    if (sortBy === 'az') {
      return list.sort((a, b) => a.title.localeCompare(b.title));
    }
    if (sortBy === 'za') {
      return list.sort((a, b) => b.title.localeCompare(a.title));
    }
    return list;
  }, [catalogMovies, sortBy]);

  const continueWatchingItems = getContinueWatchingForCurrentUser();
  const getEpisodeNumberLabel = (item: any) => {
    if (typeof item?.episodeNo === 'number' && Number.isFinite(item.episodeNo) && item.episodeNo > 0) {
      return String(Math.floor(item.episodeNo));
    }

    const rawEpisodeId = String(item?.episodeId || '').trim();
    if (/^\d{1,4}$/.test(rawEpisodeId)) {
      return rawEpisodeId;
    }

    return '?';
  };
  const isUsablePoster = (poster: string | undefined | null) => {
    const normalized = String(poster || '').trim();
    if (!normalized) return false;
    if (normalized.includes('/images/placeholder-')) return false;
    if (normalized.includes('Poster Unavailable')) return false;
    return true;
  };

  const handleLoadMore = async () => {
    if (catalogLoading || !catalogHasMore) return;

    const nextPage = catalogPage + 1;
    setCatalogLoading(true);
    try {
      const nextData = await fetchHomepage(nextPage);
      if (!nextData.length) {
        setCatalogHasMore(false);
        return;
      }

      setCatalogMovies((prev) => {
        const map = new Map<string, Drama>();
        [...prev, ...nextData].forEach((item) => {
          map.set(item.id || item.bookId || `${item.title}-${item.poster}`, item);
        });
        return Array.from(map.values());
      });
      setCatalogPage(nextPage);
    } catch (error) {
      console.error('Failed to load more catalog movies', error);
      setCatalogHasMore(false);
    } finally {
      setCatalogLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#141414]">
      <Navbar />
      <main className="relative pb-24">
        <Hero key={`hero-${platform}`} />
        <div className="px-4 lg:px-10 -mt-10 md:-mt-20 relative z-20 space-y-6">
          {continueWatchingItems.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xl md:text-2xl font-bold text-white">Lanjut Nonton</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {continueWatchingItems.map((item) => (
                  (() => {
                    const catalogPoster = sortedCatalogMovies.find(
                      (movie) => (movie.bookId || movie.id) === item.dramaId && isUsablePoster(movie.poster)
                    )?.poster;
                    const resolvedPoster =
                      (isUsablePoster(item.dramaPoster) ? item.dramaPoster : '') ||
                      (isUsablePoster(catalogPoster) ? catalogPoster : '') ||
                      '/images/placeholder-poster.svg';
                    return (
                  <button
                    key={`cw-${item.platform}-${item.dramaId}`}
                    type="button"
                    onClick={() =>
                      navigate(`/detail/${encodeURIComponent(item.dramaId)}`, {
                        state: {
                          drama: {
                            id: item.dramaId,
                            bookId: item.dramaId,
                            title: item.dramaTitle,
                            poster: resolvedPoster,
                          },
                        },
                      })
                    }
                    className="text-left space-y-2 group"
                  >
                    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md bg-gray-800">
                      <img
                        src={resolvedPoster}
                        alt={item.dramaTitle}
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (!target.src.includes('/images/placeholder-poster.svg')) {
                            target.src = '/images/placeholder-poster.svg';
                          }
                        }}
                      />
                    </div>
                    <p className="text-sm text-white line-clamp-1">{item.dramaTitle}</p>
                    <p className="text-xs text-gray-300">
                      Episode {getEpisodeNumberLabel(item)} - {Math.floor(item.progress / 60)}m {item.progress % 60}s
                    </p>
                  </button>
                    );
                  })()
                ))}
              </div>
            </section>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-xl md:text-2xl font-bold text-white">Semua Film {platform === 'dramabox' ? 'Dramabox' : platform === 'melolo' ? 'Melolo' : platform === 'netshort' ? 'NetShort' : 'Reelife'}</h2>
            <div className="flex items-center gap-3">
              <label htmlFor="sort-catalog" className="text-sm text-gray-300">Urutkan</label>
              <select
                id="sort-catalog"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'latest' | 'az' | 'za')}
                className="bg-black/60 border border-gray-700 text-white rounded-md px-3 py-2 text-sm"
              >
                <option value="latest">Terbaru</option>
                <option value="az">A - Z</option>
                <option value="za">Z - A</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {platformLoading
              ? Array.from({ length: 12 }).map((_, idx) => (
                  <div
                    key={`platform-loading-${idx}`}
                    className="aspect-[2/3] rounded-md bg-gray-800/80 animate-pulse border border-gray-700"
                  />
                ))
                : sortedCatalogMovies.map((movie) => (
                  <MovieCard
                    key={movie.id || movie.bookId || `${movie.title}-${movie.poster}`}
                    drama={movie}
                    showMeta={false}
                  />
                ))}
          </div>

          {platformLoading && (
            <p className="text-center text-sm text-gray-400">Memuat katalog {platform}...</p>
          )}

          {!platformLoading && catalogHasMore && (
            <div className="flex justify-center pt-2">
              <button
                onClick={handleLoadMore}
                disabled={catalogLoading}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed rounded-md font-semibold text-white transition"
              >
                {catalogLoading ? 'Memuat...' : 'Tampilkan Lebih Banyak'}
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
