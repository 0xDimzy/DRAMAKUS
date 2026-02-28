import { FormEvent, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useStore } from '../store/useStore';
import { saveIssueReportToCloud } from '../lib/firebaseClient';

export default function ReportIssuePage() {
  const { user, platform } = useStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (!user?.uid) {
      setError('Silakan login Google dulu sebelum kirim report.');
      return;
    }

    if (!title.trim() || !description.trim()) {
      setError('Judul dan deskripsi wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      await saveIssueReportToCloud(user.uid, {
        title: title.trim(),
        description: description.trim(),
        platform,
        page: typeof window !== 'undefined' ? window.location.pathname : '/report',
      });
      setTitle('');
      setDescription('');
      setMessage('Report berhasil dikirim. Terima kasih atas laporannya.');
    } catch (err) {
      console.error('Failed to submit issue report', err);
      setError('Gagal mengirim report. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#141414] flex flex-col">
      <Navbar />
      <main className="flex-grow px-4 md:px-12 pt-24 pb-12">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-6">Report Kendala</h1>
        <div className="max-w-2xl rounded-xl border border-gray-800 bg-black/30 p-6">
          <p className="text-sm text-gray-400 mb-5">
            Laporkan kendala saat streaming, error episode, atau masalah akun. Report akan tersimpan ke database Firebase.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="issue-title" className="mb-2 block text-sm font-semibold text-white">
                Judul Kendala
              </label>
              <input
                id="issue-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Episode tidak bisa diputar"
                className="w-full rounded-md border border-gray-700 bg-black/60 px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label htmlFor="issue-desc" className="mb-2 block text-sm font-semibold text-white">
                Deskripsi
              </label>
              <textarea
                id="issue-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="Jelaskan kendala, platform, dan langkah yang kamu lakukan."
                className="w-full rounded-md border border-gray-700 bg-black/60 px-3 py-2 text-sm text-white"
              />
            </div>
            <div className="rounded-md border border-gray-800 bg-black/40 px-3 py-2 text-xs text-gray-400">
              Platform aktif: <span className="font-semibold uppercase text-gray-200">{platform}</span>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            {message && <p className="text-sm text-green-400">{message}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {submitting ? 'Mengirim...' : 'Kirim Report'}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
