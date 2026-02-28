import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { fetchRandom, Drama } from '../lib/api';

export default function Hero() {
  const [movie, setMovie] = useState<Drama | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHero = async () => {
      try {
        const data = await fetchRandom();
        if (data && data.length > 0) {
          setMovie(data[0]);
        }
      } catch (error) {
        console.error('Failed to load hero movie', error);
      } finally {
        setLoading(false);
      }
    };
    loadHero();
  }, []);

  if (loading) {
    return (
      <div className="relative h-[70vh] w-full bg-gray-900 animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent" />
      </div>
    );
  }

  if (!movie) return null;

  const dramaId = movie.bookId || movie.id;

  return (
    <div className="relative h-[50vh] sm:h-[65vh] md:h-[80vh] w-full overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={movie.poster}
          alt={movie.title}
          className="w-full h-full object-cover object-top"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (!target.src.includes('/images/placeholder-hero.svg')) {
              target.src = '/images/placeholder-hero.svg';
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />
      </div>

      <div className="relative z-10 flex flex-col justify-center h-full px-4 sm:px-6 lg:px-12 max-w-4xl">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl sm:text-6xl font-black text-white mb-4 drop-shadow-lg"
        >
          {movie.title}
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-gray-200 text-lg sm:text-xl mb-8 line-clamp-3 max-w-2xl drop-shadow-md"
        >
          {movie.description || "Experience the drama, emotion, and excitement in this trending series. Watch now exclusively on DRAMAKUS."}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex space-x-4"
        >
          <Link
            to={`/watch/${dramaId}`}
            className="flex items-center px-6 py-3 bg-white text-black rounded-md font-bold hover:bg-gray-200 transition-colors"
          >
            <Play className="w-5 h-5 mr-2 fill-black" />
            Play
          </Link>
          <Link
            to={`/detail/${dramaId}`}
            className="flex items-center px-6 py-3 bg-gray-500/70 text-white rounded-md font-bold hover:bg-gray-500/50 transition-colors backdrop-blur-sm"
          >
            <Info className="w-5 h-5 mr-2" />
            More Info
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
