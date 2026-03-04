import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useStore, type UserRole } from '../store/useStore';
import { loadUsersForAdmin, updateUserRoleByAdmin, type AdminUserItem } from '../lib/firebaseClient';

const ROLE_OPTIONS: UserRole[] = ['member', 'vip', 'admin'];

export default function AdminUsersPage() {
  const { user } = useStore();
  const [loading, setLoading] = useState(true);
  const [savingUid, setSavingUid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<AdminUserItem[]>([]);

  const canAccess = user?.role === 'admin' && Boolean(user?.uid);

  useEffect(() => {
    let mounted = true;

    const loadUsers = async () => {
      if (!canAccess || !user?.uid) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const rows = await loadUsersForAdmin(user.uid);
        if (!mounted) return;
        setUsers(rows);
      } catch (err: any) {
        console.error('Failed to load users', err);
        if (!mounted) return;
        setError(err?.message || 'Gagal mengambil data user dari database.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadUsers();
    return () => {
      mounted = false;
    };
  }, [canAccess, user?.uid]);

  const summary = useMemo(() => {
    return users.reduce(
      (acc, item) => {
        acc[item.role] += 1;
        return acc;
      },
      { member: 0, vip: 0, admin: 0 } as Record<UserRole, number>
    );
  }, [users]);

  const handleRoleChange = async (targetUid: string, nextRole: UserRole) => {
    if (!user?.uid) return;
    setSavingUid(targetUid);
    setError(null);
    try {
      await updateUserRoleByAdmin(user.uid, targetUid, nextRole);
      setUsers((prev) =>
        prev.map((item) =>
          item.uid === targetUid
            ? {
                ...item,
                role: nextRole,
                updatedAt: Date.now(),
              }
            : item
        )
      );
    } catch (err) {
      console.error('Failed to update user role', err);
      setError('Gagal update role user.');
    } finally {
      setSavingUid(null);
    }
  };

  if (!canAccess) {
    return (
      <div className="min-h-screen bg-[#141414] flex flex-col">
        <Navbar />
        <main className="flex-grow px-4 md:px-12 pt-24 pb-12">
          <div className="mx-auto max-w-2xl rounded-xl border border-gray-800 bg-black/30 p-6 text-gray-200">
            <h1 className="text-2xl font-bold text-white">Admin Only</h1>
            <p className="mt-2 text-sm text-gray-400">Halaman ini hanya bisa diakses oleh role admin.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] flex flex-col">
      <Navbar />
      <main className="flex-grow px-4 md:px-12 pt-24 pb-12">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Admin - Kelola Role User</h1>
        <p className="mt-2 text-sm text-gray-400">Role tersimpan di Firestore collection `users`.</p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl">
          <div className="rounded-lg border border-gray-800 bg-black/40 p-4">
            <p className="text-xs text-gray-400">Member</p>
            <p className="mt-1 text-2xl font-bold text-white">{summary.member}</p>
          </div>
          <div className="rounded-lg border border-gray-800 bg-black/40 p-4">
            <p className="text-xs text-gray-400">VIP</p>
            <p className="mt-1 text-2xl font-bold text-white">{summary.vip}</p>
          </div>
          <div className="rounded-lg border border-gray-800 bg-black/40 p-4">
            <p className="text-xs text-gray-400">Admin</p>
            <p className="mt-1 text-2xl font-bold text-white">{summary.admin}</p>
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
        {loading ? (
          <p className="mt-8 text-gray-300">Memuat data user...</p>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-xl border border-gray-800 bg-black/30">
            <table className="min-w-full text-sm">
              <thead className="bg-black/50 text-gray-300">
                <tr>
                  <th className="px-4 py-3 text-left">Nama</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((item) => (
                  <tr key={item.uid} className="border-t border-gray-900">
                    <td className="px-4 py-3 text-white">{item.name}</td>
                    <td className="px-4 py-3 text-gray-300">{item.email || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-gray-800 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-red-400">
                        {item.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={item.role}
                        disabled={savingUid === item.uid}
                        onChange={(e) => handleRoleChange(item.uid, e.target.value as UserRole)}
                        className="rounded border border-gray-700 bg-black/70 px-2 py-1 text-xs text-white disabled:opacity-60"
                      >
                        {ROLE_OPTIONS.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-center text-gray-400" colSpan={4}>
                      Belum ada data user.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
