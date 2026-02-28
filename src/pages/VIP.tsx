import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function VIP() {
  return (
    <div className="min-h-screen bg-[#141414] flex flex-col">
      <Navbar />
      <main className="flex-grow px-4 md:px-12 pt-24 pb-12">
        <div className="mx-auto max-w-3xl rounded-2xl border border-gray-800 bg-black/30 p-8 text-center">
          <p className="text-xs font-semibold tracking-[0.25em] text-red-400">DRAMAKUS</p>
          <h1 className="mt-3 text-3xl font-black text-white md:text-5xl">VIP COMING SOON</h1>
          <p className="mt-4 text-gray-300">
            Fitur VIP sedang kami siapkan. Nantikan update berikutnya untuk akses konten eksklusif.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
