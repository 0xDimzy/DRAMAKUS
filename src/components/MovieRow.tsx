import { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import MovieCard from './MovieCard';
import { Drama } from '../lib/api';

interface MovieRowProps {
  title: string;
  fetchData: () => Promise<Drama[]>;
}

export default function MovieRow({ title, fetchData }: MovieRowProps) {
  const [movies, setMovies] = useState<Drama[]>([]);

  useEffect(() => {
    const loadMovies = async () => {
      try {
        const data = await fetchData();
        setMovies(data);
      } catch (error) {
        console.error(`Failed to load movies for ${title}`, error);
      }
    };
    loadMovies();
  }, [fetchData, title]);

  if (movies.length === 0) return null;

  return (
    <div className="space-y-2 md:space-y-4 px-4">
      <h2 className="w-56 cursor-pointer text-sm font-semibold text-[#e5e5e5] transition duration-200 hover:text-white md:text-2xl">
        {title}
      </h2>
      <div className="group relative md:-ml-2">
        <Swiper
          modules={[Navigation, Pagination]}
          navigation
          spaceBetween={15}
          slidesPerView={2.2}
          breakpoints={{
            640: { slidesPerView: 3.2 },
            768: { slidesPerView: 4.2 },
            1024: { slidesPerView: 5.2 },
            1280: { slidesPerView: 6.2 },
          }}
          className="movie-row-swiper !pb-12 !px-2"
        >
          {movies.map((movie, index) => (
            <SwiperSlide key={`${movie.id}-${index}`}>
              <MovieCard drama={movie} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
}
