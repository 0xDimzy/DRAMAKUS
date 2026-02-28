import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useStore } from '../store/useStore';

const SETTINGS_KEY = 'sahun-ceo-settings';

type AppSettings = {
  autoplayNextEpisode: boolean;
  preferredQuality: 'auto' | '1080p' | '720p' | '480p';
};

const defaultSettings: AppSettings = {
  autoplayNextEpisode: true,
  preferredQuality: 'auto',
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const {
    platform,
    clearContinueWatchingForCurrentUser,
    clearMyListForCurrentPlatform,
    clearAllMyList,
  } = useStore();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      setSettings({
        autoplayNextEpisode: Boolean(parsed?.autoplayNextEpisode),
        preferredQuality: parsed?.preferredQuality || 'auto',
      });
    } catch (error) {
      console.error('Failed to load settings', error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const resetAppSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem(SETTINGS_KEY);
  };

  return (
    <div className="min-h-screen bg-[#141414] flex flex-col">
      <Navbar />
      <main className="flex-grow px-4 md:px-12 pt-24 pb-12">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-6">Settings</h1>

        <div className="max-w-2xl rounded-xl border border-gray-800 bg-black/30 p-6 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-white font-semibold">Autoplay Episode Berikutnya</p>
              <p className="text-sm text-gray-400">Pindah otomatis ke episode berikut setelah selesai.</p>
            </div>
            <button
              type="button"
              onClick={() =>
                setSettings((prev) => ({ ...prev, autoplayNextEpisode: !prev.autoplayNextEpisode }))
              }
              className={`h-8 w-14 rounded-full transition ${
                settings.autoplayNextEpisode ? 'bg-red-600' : 'bg-gray-700'
              }`}
            >
              <span
                className={`block h-6 w-6 rounded-full bg-white transition transform ${
                  settings.autoplayNextEpisode ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div>
            <label htmlFor="preferred-quality" className="text-white font-semibold block mb-2">
              Kualitas Video Default
            </label>
            <select
              id="preferred-quality"
              value={settings.preferredQuality}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  preferredQuality: e.target.value as AppSettings['preferredQuality'],
                }))
              }
              className="w-full rounded-md bg-black/60 border border-gray-700 px-3 py-2 text-sm text-white"
            >
              <option value="auto">Auto</option>
              <option value="1080p">1080p</option>
              <option value="720p">720p</option>
              <option value="480p">480p</option>
            </select>
          </div>

          <div className="border-t border-gray-800 pt-6">
            <p className="text-white font-semibold">Reset Lanjut Nonton</p>
            <p className="text-sm text-gray-400 mt-1">Hapus semua riwayat progress tontonan akun ini.</p>
            <button
              type="button"
              onClick={() => {
                const ok = window.confirm('Hapus semua data Lanjut Nonton untuk akun ini?');
                if (!ok) return;
                clearContinueWatchingForCurrentUser();
              }}
              className="mt-3 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition"
            >
              Clear Lanjut Nonton
            </button>
          </div>

          <div className="border-t border-gray-800 pt-6">
            <p className="text-white font-semibold">Reset My List</p>
            <p className="text-sm text-gray-400 mt-1">Hapus daftar favorit di platform aktif atau semua platform.</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  const ok = window.confirm(`Hapus My List untuk platform ${platform}?`);
                  if (!ok) return;
                  clearMyListForCurrentPlatform();
                }}
                className="rounded-md bg-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-600 transition"
              >
                Clear My List ({platform})
              </button>
              <button
                type="button"
                onClick={() => {
                  const ok = window.confirm('Hapus semua My List dari semua platform?');
                  if (!ok) return;
                  clearAllMyList();
                }}
                className="rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition"
              >
                Clear Semua My List
              </button>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6">
            <p className="text-white font-semibold">Reset Preferensi Aplikasi</p>
            <p className="text-sm text-gray-400 mt-1">Kembalikan semua pengaturan player ke default.</p>
            <button
              type="button"
              onClick={() => {
                const ok = window.confirm('Reset semua pengaturan aplikasi ke default?');
                if (!ok) return;
                resetAppSettings();
              }}
              className="mt-3 rounded-md bg-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-600 transition"
            >
              Reset Settings
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
