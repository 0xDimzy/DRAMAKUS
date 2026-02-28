export interface UpdateLogItem {
  date: string;
  text: string;
}

// Tambahkan item baru di paling atas agar muncul paling pertama di notifikasi.
export const updateLogs: UpdateLogItem[] = [
  { date: '2026-02-28', text: 'Peningkatan performa saat menonton drama.' },
  { date: '2026-02-28', text: 'Kontrol Prev/Next di mobile kini auto-hide agar player lebih bersih.' },
  { date: '2026-02-28', text: 'Perbaikan tampilan detail episode lintas platform.' },
  { date: '2026-02-28', text: 'Normalisasi judul episode Reelife agar konsisten.' },
  { date: '2026-02-28', text: 'Penyempurnaan sinkronisasi continue watching.' },
];
