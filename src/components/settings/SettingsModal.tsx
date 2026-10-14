import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Settings,
  Lock,
  Download,
  Upload,
  Trash2,
  Key,
  Calendar,
  Share2,
  ShieldAlert,
  Wine,
  Film,
  X
} from 'lucide-react';
import { AppSettings } from '../../types';
import { appStorage } from '../../utils/storage';

interface SettingsModalProps {
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onClose: () => void;
  onWipeCycleData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSaveSettings,
  onClose,
  onWipeCycleData
}) => {
  const [formData, setFormData] = useState<AppSettings>({ ...settings });
  const [importStatus, setImportStatus] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    onClose();
  };

  const handleExport = () => {
    appStorage.exportBackup();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const ok = appStorage.importBackup(content);
      if (ok) {
        setImportStatus('Backup berhasil dipulihkan! Halaman akan dimuat ulang...');
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setImportStatus('Gagal memproses file backup JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 25 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 25 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="bg-[#EFE6DA] dark:bg-[#250709] max-w-lg w-full rounded-3xl p-6 sm:p-8 border-2 border-[#7A1018]/30 shadow-2xl my-8"
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#7A1018]/15 mb-6">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-[#7A1018] dark:text-[#F4B6C2]" />
            <h3 className="font-serif-title text-2xl font-bold text-[#7A1018] dark:text-[#F4B6C2]">
              Pengaturan Aplikasi
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-500 hover:text-black dark:hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-xs font-sans-clean">
          {/* Couple Dates Section */}
          <div className="p-4 rounded-2xl bg-white/60 dark:bg-black/30 border border-[#7A1018]/15 space-y-3">
            <h4 className="font-bold text-[#7A1018] dark:text-[#F4B6C2] flex items-center space-x-1.5 uppercase tracking-wider text-[11px]">
              <Calendar className="w-3.5 h-3.5" />
              <span>Tanggal Bersejarah Berdua</span>
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1">Tanggal Jadian *</label>
                <input
                  type="date"
                  required
                  value={formData.anniversaryDate}
                  onChange={(e) => setFormData({ ...formData, anniversaryDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/30 border border-[#7A1018]/20"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Pertemuan Pertama</label>
                <input
                  type="date"
                  required
                  value={formData.firstMeetDate}
                  onChange={(e) => setFormData({ ...formData, firstMeetDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/30 border border-[#7A1018]/20"
                />
              </div>
            </div>
          </div>

          {/* Privacy & PIN Section */}
          <div className="p-4 rounded-2xl bg-white/60 dark:bg-black/30 border border-[#7A1018]/15 space-y-3">
            <h4 className="font-bold text-[#7A1018] dark:text-[#F4B6C2] flex items-center space-x-1.5 uppercase tracking-wider text-[11px]">
              <Lock className="w-3.5 h-3.5" />
              <span>Keamanan PIN & Mode Tamu</span>
            </h4>

            <div>
              <label className="block font-bold mb-1">4-Digit PIN Pembuka</label>
              <input
                type="text"
                maxLength={4}
                required
                value={formData.pin}
                onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })}
                className="w-32 px-3 py-2 rounded-xl bg-white dark:bg-black/30 border border-[#7A1018]/20 font-bold tracking-widest text-center text-sm"
              />
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="isGuestMode"
                checked={formData.isGuestMode}
                onChange={(e) => setFormData({ ...formData, isGuestMode: e.target.checked })}
                className="rounded text-[#7A1018]"
              />
              <label htmlFor="isGuestMode" className="cursor-pointer font-bold text-[#3B0A0F] dark:text-[#EFE6DA]">
                Aktifkan Mode Tamu (Sembunyikan pin rumah/kos/motel, modul siklus, & log intim)
              </label>
            </div>
          </div>

          {/* Cycle Sharing with Partner */}
          <div className="p-4 rounded-2xl bg-white/60 dark:bg-black/30 border border-[#7A1018]/15 space-y-3">
            <h4 className="font-bold text-[#7A1018] dark:text-[#F4B6C2] flex items-center space-x-1.5 uppercase tracking-wider text-[11px]">
              <Share2 className="w-3.5 h-3.5" />
              <span>Berbagi Data Siklus dengan Pasangan</span>
            </h4>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="shareCycle"
                checked={formData.shareCycleWithPartner}
                onChange={(e) => setFormData({ ...formData, shareCycleWithPartner: e.target.checked })}
                className="rounded text-[#7A1018]"
              />
              <label htmlFor="shareCycle" className="cursor-pointer font-medium">
                Bagikan data siklus dan log intim dengan Savero (Default Menyala)
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="shareOnlyPred"
                checked={formData.shareOnlyPredictions}
                onChange={(e) => setFormData({ ...formData, shareOnlyPredictions: e.target.checked })}
                className="rounded text-[#7A1018]"
              />
              <label htmlFor="shareOnlyPred" className="cursor-pointer font-medium text-gray-600 dark:text-gray-300">
                Batasi hanya bagikan prediksi haid & masa subur (tanpa catatan detail intim)
              </label>
            </div>
          </div>

          {/* Optional Alcohol Category */}
          <div className="p-4 rounded-2xl bg-white/60 dark:bg-black/30 border border-[#7A1018]/15 space-y-2">
            <h4 className="font-bold text-[#7A1018] dark:text-[#F4B6C2] flex items-center space-x-1.5 uppercase tracking-wider text-[11px]">
              <Wine className="w-3.5 h-3.5" />
              <span>Kategori Minuman Dewasa (Alkohol)</span>
            </h4>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="allowAlcohol"
                checked={formData.allowAlcoholCategory}
                onChange={(e) => setFormData({ ...formData, allowAlcoholCategory: e.target.checked })}
                className="rounded text-[#7A1018]"
              />
              <label htmlFor="allowAlcohol" className="cursor-pointer font-medium">
                Izinkan kategori minuman cocktail/alkohol di Wishlist (selalu tersembunyi di Mode Tamu)
              </label>
            </div>
          </div>

          {/* TMDB API Key */}
          <div className="p-4 rounded-2xl bg-white/60 dark:bg-black/30 border border-[#7A1018]/15 space-y-2">
            <h4 className="font-bold text-[#7A1018] dark:text-[#F4B6C2] flex items-center space-x-1.5 uppercase tracking-wider text-[11px]">
              <Film className="w-3.5 h-3.5" />
              <span>TMDB API Key (Opsional)</span>
            </h4>
            <input
              type="text"
              value={formData.tmdbApiKey || ''}
              onChange={(e) => setFormData({ ...formData, tmdbApiKey: e.target.value })}
              placeholder="Masukkan TMDB v3 API Key jika ingin live search..."
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/30 border border-[#7A1018]/20"
            />
          </div>

          {/* Backup & Restore */}
          <div className="p-4 rounded-2xl bg-white/60 dark:bg-black/30 border border-[#7A1018]/15 space-y-3">
            <h4 className="font-bold text-[#7A1018] dark:text-[#F4B6C2] uppercase tracking-wider text-[11px]">
              Cadangan Data (Ekspor & Impor JSON)
            </h4>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleExport}
                className="px-4 py-2 bg-[#7A1018] text-[#EFE6DA] rounded-xl font-bold flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Cadangan JSON</span>
              </button>

              <label className="px-4 py-2 bg-white/80 dark:bg-black/40 text-[#7A1018] dark:text-[#F4B6C2] border border-[#7A1018]/30 rounded-xl font-bold flex items-center space-x-1.5 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Pulihkan Cadangan</span>
                <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
              </label>
            </div>

            {importStatus && <p className="text-[11px] font-bold text-green-600">{importStatus}</p>}
          </div>

          {/* Clear Cycle Data */}
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 flex items-center justify-between">
            <div>
              <span className="font-bold text-red-900 dark:text-red-200 block">Hapus Data Sensitif</span>
              <span className="text-[10px] text-red-700 dark:text-red-400">
                Menghapus seluruh riwayat periode haid & log intim dari perangkat ini.
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (confirm('Yakin ingin menghapus seluruh data siklus & log hubungan intim?')) {
                  onWipeCycleData();
                  alert('Data siklus & intim berhasil dihapus.');
                }
              }}
              className="px-3 py-1.5 bg-red-600 text-white rounded-xl font-bold"
            >
              Hapus Data Siklus
            </button>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-[#7A1018]/15">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-bold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#7A1018] text-[#EFE6DA] rounded-xl font-bold hover:bg-[#5e0a11]"
            >
              Simpan Pengaturan
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
