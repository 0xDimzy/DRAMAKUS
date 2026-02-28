import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import MovieCard from '../components/MovieCard';
import Footer from '../components/Footer';
import { fetchDubIndo, Drama } from '../lib/api';

export default function DubIndo() {
  const [movies, setMovies] = useState<Drama[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchDubIndo(page, 'terpopuler');
        setMovies(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [page]);

  return (
    <div className="min-h-screen bg-[#141414] flex flex-col">
      <Navbar />
      <div className="pt-24 px-4 md:px-12 flex-grow">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Dubbed in Indonesian</h1>
          <div className="flex space-x-2">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 bg-gray-800 text-white rounded disabled:opacity-50 hover:bg-gray-700 transition-colors"
            >
              Prev
            </button>
            <span className="px-4 py-2 text-white">Page {page}</span>
            <button 
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-gray-800 animate-pulse rounded-md" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 mb-12">
            {movies.map((drama, index) => (
              <MovieCard key={`${drama.bookId || drama.id}-${index}`} drama={drama} showMeta={false} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
