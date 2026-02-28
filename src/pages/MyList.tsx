import Navbar from '../components/Navbar';
import MovieCard from '../components/MovieCard';
import Footer from '../components/Footer';
import { useStore } from '../store/useStore';

export default function MyList() {
  const { myList, platform } = useStore();
  const scopedMyList = myList.filter((item: any) => (item?._platform || 'dramabox') === platform);

  return (
    <div className="min-h-screen bg-[#141414] flex flex-col">
      <Navbar />
      <div className="pt-24 px-4 md:px-12 flex-grow">
        <h1 className="text-2xl font-bold text-white mb-6">My List</h1>
        
        {scopedMyList.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 mb-12">
            {scopedMyList.map((drama, index) => (
              <MovieCard key={`${drama.bookId || drama.id}-${index}`} drama={drama} showMeta={false} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[50vh] text-gray-400">
            <p className="text-xl mb-4">My List kosong untuk platform ini.</p>
            <p>Tambahkan drama pada platform {platform} agar muncul di sini.</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
