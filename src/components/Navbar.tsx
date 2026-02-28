import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, User, Menu, X, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import {
  initializeFirebase,
  loadContinueWatchingFromCloud,
  onFirebaseAuthState,
  saveUserProfileToCloud,
  signInWithFirebaseGoogle,
  signOutFirebase,
} from '../lib/firebaseClient';
import { updateLogs } from '../data/updateLogs';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [firebaseReady, setFirebaseReady] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login, logout, platform, setPlatform, setContinueWatchingForCurrentUser } = useStore();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | null = null;

    const setup = async () => {
      const ready = await initializeFirebase();
      if (!mounted) return;
      setFirebaseReady(ready);
      if (!ready) return;

      unsubscribe = await onFirebaseAuthState(async (firebaseUser) => {
        if (!mounted) return;

        if (!firebaseUser?.uid || !firebaseUser?.email) {
          logout();
          return;
        }

        login({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email,
          picture: firebaseUser.photoURL || undefined,
        });

        try {
          await saveUserProfileToCloud(firebaseUser.uid, {
            name: firebaseUser.displayName || firebaseUser.email,
            email: firebaseUser.email,
            picture: firebaseUser.photoURL || undefined,
          });
        } catch (error) {
          console.error('Failed to save user profile to cloud', error);
        }

        try {
          const cloudEntries = await loadContinueWatchingFromCloud(firebaseUser.uid);
          if (!mounted) return;
          setContinueWatchingForCurrentUser(cloudEntries);
        } catch (error) {
          console.error('Failed to load continue watching from cloud', error);
        }
      });
    };

    setup();

    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [login, logout, setContinueWatchingForCurrentUser]);

  const handlePlatformChange = (newPlatform: 'dramabox' | 'melolo' | 'netshort' | 'reelife') => {
    setPlatform(newPlatform);
    setIsMobileMenuOpen(false);
    navigate('/home');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${searchQuery}`);
      setIsMobileMenuOpen(false);
    }
  };

  const handleLogin = async () => {
    setAuthBusy(true);
    try {
      await signInWithFirebaseGoogle();
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error('Firebase login failed', error);
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLogout = async () => {
    setAuthBusy(true);
    try {
      await signOutFirebase();
      logout();
    } catch (error) {
      console.error('Firebase logout failed', error);
    } finally {
      setAuthBusy(false);
    }
  };

  const navLinks = [
    { name: 'Home', path: '/home' },
    { name: 'VIP', path: '/vip' },
    { name: 'Dub Indo', path: '/dubindo' },
    { name: 'My List', path: '/mylist' },
  ];
  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        isScrolled ? 'bg-black/95 shadow-lg' : 'bg-gradient-to-b from-black/80 to-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <div className="flex items-center">
            <Link to="/home" className="text-red-600 text-2xl md:text-3xl font-black tracking-tighter uppercase italic">
              DRAMAKUS
            </Link>
            <div className="hidden md:flex ml-10 items-center space-x-6">
              <div className="flex bg-gray-900/50 p-1 rounded-lg border border-gray-800">
                <button onClick={() => handlePlatformChange('dramabox')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${platform === 'dramabox' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>Dramabox</button>
                <button onClick={() => handlePlatformChange('melolo')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${platform === 'melolo' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>Melolo</button>
                <button onClick={() => handlePlatformChange('netshort')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${platform === 'netshort' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>NetShort</button>
                <button onClick={() => handlePlatformChange('reelife')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${platform === 'reelife' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>Reelife</button>
              </div>
              <div className="flex items-baseline space-x-6">
                {navLinks.map((link) => (
                  <Link key={link.path} to={link.path} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname === link.path ? 'text-white font-bold' : 'text-gray-300 hover:text-white'}`}>
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6 space-x-6">
              <form onSubmit={handleSearch} className="relative group">
                <input type="text" placeholder="Search dramas..." className="bg-black/40 border border-gray-700 text-white text-sm rounded-full focus:ring-red-600 focus:border-red-600 block w-full pl-10 p-2 transition-all focus:w-72 w-40 backdrop-blur-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400 group-focus-within:text-red-600 transition-colors" />
                </div>
              </form>

              <div className="relative group">
                <button
                  type="button"
                  className="relative rounded-full border border-gray-700 bg-black/30 p-2 text-gray-300 transition-colors hover:text-white"
                  aria-label="Notifikasi update"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute -right-1 -top-1 inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
                </button>
                <div className="absolute right-0 mt-3 w-80 rounded-lg border border-gray-800 bg-[#141414] py-2 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                  <div className="px-4 py-2 border-b border-gray-800">
                    <p className="text-sm font-semibold text-white">Log Update</p>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {updateLogs.map((item, index) => (
                      <div key={`${item.date}-${index}`} className="px-4 py-3 border-b border-gray-900 last:border-b-0">
                        <p className="text-[11px] text-gray-500">{item.date}</p>
                        <p className="text-sm text-gray-200 mt-1">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative group">
                <button className="flex items-center gap-2 text-gray-300 hover:text-white transition-all rounded-md border border-gray-700 bg-black/30 px-2 py-1.5">
                  <div className="h-9 w-9 rounded-md bg-red-600 flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform overflow-hidden">
                    {user?.picture ? <img src={user.picture} alt={user.name} className="h-full w-full object-cover" /> : <User className="h-6 w-6 text-white" />}
                  </div>
                  {!user && <span className="text-xs font-semibold text-white">Login</span>}
                </button>
                <div className="absolute right-0 mt-3 w-72 bg-[#141414] border border-gray-800 rounded-lg shadow-2xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                  {user ? (
                    <>
                      <div className="px-4 py-3 text-sm text-gray-300 border-b border-gray-800 mb-1">
                        Signed in as <span className="font-bold text-white block mt-1">{user.name}</span>
                        <span className="text-xs text-gray-500 block mt-1">{user.email}</span>
                      </div>
                      <Link to="/mylist" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">My List</Link>
                      <Link to="/user" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">User Page</Link>
                      <Link to="/settings" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">Settings</Link>
                      <button onClick={handleLogout} disabled={authBusy} className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-800 transition-colors disabled:opacity-60">Sign out</button>
                    </>
                  ) : (
                    <div className="px-4 py-3 space-y-3">
                      <button
                        type="button"
                        onClick={handleLogin}
                        disabled={!firebaseReady || authBusy}
                        className="w-full rounded-md bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-60"
                      >
                        {authBusy ? 'Memproses...' : 'Login dengan Google'}
                      </button>
                      {!firebaseReady && <p className="text-xs text-yellow-400">Set env Firebase agar login aktif.</p>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="-mr-2 flex md:hidden">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 focus:outline-none transition-colors">
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="md:hidden bg-[#141414]/98 backdrop-blur-xl border-b border-gray-800">
            <div className="px-4 pt-4 pb-6 space-y-2">
              <div className="flex bg-gray-900 p-1 rounded-lg border border-gray-800 mb-4">
                <button onClick={() => handlePlatformChange('dramabox')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${platform === 'dramabox' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400'}`}>Dramabox</button>
                <button onClick={() => handlePlatformChange('melolo')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${platform === 'melolo' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400'}`}>Melolo</button>
                <button onClick={() => handlePlatformChange('netshort')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${platform === 'netshort' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400'}`}>NetShort</button>
                <button onClick={() => handlePlatformChange('reelife')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${platform === 'reelife' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400'}`}>Reelife</button>
              </div>

              {navLinks.map((link) => (
                <Link key={link.path} to={link.path} onClick={() => setIsMobileMenuOpen(false)} className={`block px-4 py-3 rounded-lg text-base font-medium transition-all ${location.pathname === link.path ? 'bg-red-600/10 text-red-600 border-l-4 border-red-600' : 'text-gray-300 hover:bg-gray-800'}`}>
                  {link.name}
                </Link>
              ))}

              <div className="pt-4 border-t border-gray-800 mt-4 space-y-3">
                <div className="rounded-lg border border-gray-800 bg-black/30 p-3">
                  <p className="text-sm font-semibold text-white mb-2">Log Update</p>
                  <div className="space-y-2">
                    {updateLogs.slice(0, 2).map((item, index) => (
                      <div key={`mobile-${item.date}-${index}`}>
                        <p className="text-[11px] text-gray-500">{item.date}</p>
                        <p className="text-xs text-gray-200">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleSearch} className="relative">
                  <input type="text" placeholder="Search dramas..." className="bg-gray-900 border border-gray-800 text-white text-sm rounded-lg block w-full p-3 pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-500" />
                </form>

                {user ? (
                  <div className="rounded-lg border border-gray-800 bg-black/30 p-3">
                    <p className="text-sm text-white font-semibold">{user.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{user.email}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Link to="/user" onClick={() => setIsMobileMenuOpen(false)} className="rounded-md border border-gray-700 px-3 py-2 text-center text-xs text-gray-200">User</Link>
                      <Link to="/settings" onClick={() => setIsMobileMenuOpen(false)} className="rounded-md border border-gray-700 px-3 py-2 text-center text-xs text-gray-200">Settings</Link>
                    </div>
                    <button onClick={handleLogout} disabled={authBusy} className="mt-3 w-full rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">Sign out</button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleLogin}
                    disabled={!firebaseReady || authBusy}
                    className="w-full rounded-md bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-60"
                  >
                    {authBusy ? 'Memproses...' : 'Login dengan Google'}
                  </button>
                )}
                {!firebaseReady && <p className="text-xs text-yellow-400">Set env Firebase agar login aktif.</p>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
