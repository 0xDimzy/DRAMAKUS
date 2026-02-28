import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useStore } from '../store/useStore';
import { signOutFirebase } from '../lib/firebaseClient';

export default function UserPage() {
  const navigate = useNavigate();
  const {
    user,
    logout,
    platform,
    myList,
    getContinueWatchingForCurrentUser,
    clearContinueWatchingForCurrentUser,
  } = useStore();

  const continueWatchingCount = getContinueWatchingForCurrentUser().length;
  const myListPlatformCount = myList.filter((item: any) => (item?._platform || 'dramabox') === platform).length;

  const handleLogout = async () => {
    try {
      await signOutFirebase();
      logout();
      navigate('/home');
    } catch (error) {
      console.error('Failed to logout', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#141414] flex flex-col">
      <Navbar />
      <main className="flex-grow px-4 md:px-12 pt-24 pb-12">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-6">User Profile</h1>

        {user ? (
          <div className="max-w-2xl rounded-xl border border-gray-800 bg-black/30 p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full overflow-hidden bg-red-600 flex items-center justify-center">
                {user.picture ? (
                  <img src={user.picture} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-white font-bold text-xl">{user.name.slice(0, 1).toUpperCase()}</span>
                )}
              </div>
              <div>
                <p className="text-white text-xl font-semibold">{user.name}</p>
                <p className="text-gray-400 text-sm">{user.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg border border-gray-800 bg-black/40 p-4">
                <p className="text-xs text-gray-400">Platform Aktif</p>
                <p className="text-white text-lg font-bold mt-1 uppercase">{platform}</p>
              </div>
              <div className="rounded-lg border border-gray-800 bg-black/40 p-4">
                <p className="text-xs text-gray-400">My List ({platform})</p>
                <p className="text-white text-lg font-bold mt-1">{myListPlatformCount}</p>
              </div>
              <div className="rounded-lg border border-gray-800 bg-black/40 p-4">
                <p className="text-xs text-gray-400">Lanjut Nonton</p>
                <p className="text-white text-lg font-bold mt-1">{continueWatchingCount}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate('/settings')}
                className="rounded-md bg-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-600 transition"
              >
                Buka Settings
              </button>
              <button
                type="button"
                onClick={() => {
                  const ok = window.confirm('Hapus semua data Lanjut Nonton untuk akun ini?');
                  if (!ok) return;
                  clearContinueWatchingForCurrentUser();
                }}
                className="rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition"
              >
                Clear Lanjut Nonton
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-gray-200 transition"
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-xl rounded-xl border border-gray-800 bg-black/30 p-6 text-gray-300">
            <p className="text-lg font-semibold text-white mb-2">Belum login</p>
            <p>Silakan login Google dari menu profil di pojok kanan atas.</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
