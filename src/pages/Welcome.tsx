import { Link } from 'react-router-dom';

export default function Welcome() {
  return (
    <main className="min-h-screen bg-[#090b10] text-white">
      <div className="relative overflow-hidden">
        <div className="absolute -top-40 -left-24 h-96 w-96 rounded-full bg-red-700/30 blur-3xl" />
        <div className="absolute -bottom-52 -right-20 h-[28rem] w-[28rem] rounded-full bg-blue-700/20 blur-3xl" />

        <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-16 md:px-10">
          <p className="mb-4 text-xs font-semibold tracking-[0.25em] text-red-400">WELCOME TO</p>
          <h1 className="max-w-4xl text-4xl font-black leading-tight sm:text-5xl md:text-7xl">
            DRAMAKUS
          </h1>
          <p className="mt-6 max-w-2xl text-sm text-gray-300 sm:text-base md:text-lg">
            Stream drama favoritmu lintas platform dalam satu tempat. Lanjut nonton otomatis, akun sinkron, dan
            pengalaman yang responsif di HP maupun desktop.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/home"
              className="rounded-md bg-red-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-red-500"
            >
              Mulai Menonton
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            <div className="rounded-lg border border-gray-800 bg-black/30 p-4">
              <p className="text-xs text-gray-400">Platform</p>
              <p className="mt-1 font-semibold">Dramabox, Melolo, NetShort, Reelife</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
