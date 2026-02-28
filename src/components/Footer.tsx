export default function Footer() {
  const platforms = ['Dramabox', 'Melolo', 'NetShort', 'Reelife'];

  return (
    <footer className="relative mt-14 overflow-hidden border-t border-gray-800 bg-[#141414] px-4 py-10 text-gray-400 sm:px-6 md:px-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(220,38,38,0.16),transparent_42%)]" />

      <div className="relative mx-auto max-w-6xl">
        <div className="grid gap-6 md:grid-cols-[1.4fr_1fr] md:items-end">
          <div>
            <p className="text-xl font-extrabold tracking-wide text-white">DRAMAKUS</p>
            <p className="mt-2 text-sm text-gray-300">Streaming lintas platform dalam satu aplikasi.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {platforms.map((platform) => (
                <span
                  key={platform}
                  className="rounded-full border border-gray-700 bg-black/40 px-3 py-1 text-xs text-gray-200"
                >
                  {platform}
                </span>
              ))}
            </div>
          </div>

          <div className="text-left md:text-right">
            <p className="text-xs text-gray-400">(c) 2026 DRAMAKUS Streaming, Inc.</p>
            <p className="mt-2 text-sm italic text-gray-300">Ini hanyalah akal akalan manusia.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
