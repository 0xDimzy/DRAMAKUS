import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import MovieCard from '../components/MovieCard';
import Footer from '../components/Footer';
import { searchDrama, Drama } from '../lib/api';

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
  const [results, setResults] = useState<Drama[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const doSearch = async () => {
      if (query) {
        setLoading(true);
        try {
          const data = await searchDrama(query);
          setResults(data);
        } catch (error) {
          console.error('Search failed', error);
        } finally {
          setLoading(false);
        }
      }
    };
    doSearch();
  }, [query]);

  return (
    <div className="min-h-screen bg-[#141414] flex flex-col">
      <Navbar />
      <div className="pt-24 px-4 md:px-12 flex-grow">
        <h1 className="text-2xl font-bold text-white mb-6">
          Search Results for "{query}"
        </h1>
        
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-gray-800 animate-pulse rounded-md" />
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 mb-12">
            {results.map((drama, index) => (
              <div key={`${drama.bookId || drama.id}-${index}`} className="relative group">
                <MovieCard drama={drama} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No results found.</p>
        )}
      </div>
      <Footer />
    </div>
  );
}
