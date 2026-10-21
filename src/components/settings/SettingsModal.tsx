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
  ShieldAlert,
  Moon,
  Bell,
  Check
} from 'lucide-react';
import { AppSettings, NotificationSettings } from '../../types';
import { appStorage } from '../../utils/storage';
import { CloseButton } from '../common/CloseButton';
import { requestWebPushPermission } from '../../utils/notifications';

interface SettingsModalProps {
  settings: AppSettings;
  isAdminAccount?: boolean;
  adminMode?: boolean;
  onSaveSettings: (settings: AppSettings) => void;
  onToggleAdminMode?: () => void;
  onClose: () => void;
  onWipeCycleData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  isAdminAccount = false,
  adminMode = false,
  onSaveSettings,
  onToggleAdminMode,
  onClose,
  onWipeCycleData
}) => {
  const [formData, setFormData] = useState<AppSettings>({
    ...settings,
    notifications: {
      enabled: true,
      webPush: true,
      inAppToast: true,
      notifyOnPin: true,
      notifyOnPhoto: true,
      notifyOnWishlist: true,
      notifyOnReply: true,
      notifyOnStreak: true,
      notifyOnNotes: true,
      ...(settings.notifications ?? {})
    }
  });
  const [importStatus, setImportStatus] = useState<string>('');
  const [pushStatus, setPushStatus] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );

  const handleRequestPush = async () => {
    const perm = await requestWebPushPermission();
    setPushStatus(perm);
  };

  const updateNotificationSetting = <K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) => {
    setFormData((prev) => ({
      ...prev,
      notifications: {
        enabled: true,
        webPush: true,
        inAppToast: true,
        notifyOnPin: true,
        notifyOnPhoto: true,
        notifyOnWishlist: true,
        notifyOnReply: true,
        notifyOnStreak: true,
        notifyOnNotes: true,
        ...(prev.notifications ?? {}),
        [key]: value
      }
    }));
  };

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
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-3 backdrop-blur-md sm:p-4"
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 25 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 25 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        data-lenis-prevent
        className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-3xl border-2 border-[#7A1018]/30 bg-[#fffaf0] p-5 text-[#57202c] shadow-2xl dark:bg-[#250709] dark:text-rose-50 sm:p-8"
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#7A1018]/15 mb-6">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-[#7A1018] dark:text-[#F4B6C2]" />
            <h3 className="font-serif-title text-2xl font-bold text-[#7A1018] dark:text-[#F4B6C2]">
              Pengaturan Aplikasi
            </h3>
          </div>
          <CloseButton onClick={onClose} />
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
                  className="min-h-11 w-full rounded-xl border border-[#7A1018]/20 bg-white px-3 py-2 text-[#57202c] dark:bg-black/30 dark:text-rose-50 dark:[color-scheme:dark]"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Pertemuan Pertama</label>
                <input
                  type="date"
                  required
                  value={formData.firstMeetDate}
                  onChange={(e) => setFormData({ ...formData, firstMeetDate: e.target.value })}
                  className="min-h-11 w-full rounded-xl border border-[#7A1018]/20 bg-white px-3 py-2 text-[#57202c] dark:bg-black/30 dark:text-rose-50 dark:[color-scheme:dark]"
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

            <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-white/50 px-3 dark:bg-white/5">
              <input
                type="checkbox"
                checked={formData.darkMode}
                onChange={(e) => setFormData({ ...formData, darkMode: e.target.checked })}
                className="rounded text-[#7A1018]"
              />
              <Moon className="h-4 w-4" />
              <span className="font-medium">Gunakan tampilan gelap</span>
            </label>

            <div>
              <label className="block font-bold mb-1">4-Digit PIN Pembuka</label>
              <input
                type="text"
                maxLength={4}
                required
                value={formData.pin}
                onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })}
                className="min-h-11 w-32 rounded-xl border border-[#7A1018]/20 bg-white px-3 py-2 text-center text-sm font-bold tracking-widest text-[#57202c] dark:bg-black/30 dark:text-rose-50"
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

          {/* Realtime & Push Notification Settings */}
          <div className="p-4 rounded-2xl bg-white/60 dark:bg-black/30 border border-[#7A1018]/15 space-y-3.5">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-[#7A1018] dark:text-[#F4B6C2] flex items-center space-x-1.5 uppercase tracking-wider text-[11px]">
                <Bell className="w-3.5 h-3.5" />
                <span>Pengaturan Notifikasi Realtime</span>
              </h4>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.notifications?.enabled ?? true}
                  onChange={(e) => updateNotificationSetting('enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all dark:border-gray-600 peer-checked:bg-[#7A1018]"></div>
              </label>
            </div>

            <p className="text-[10px] text-[#713a49] dark:text-rose-200/80 leading-relaxed">
              Dapatkan notifikasi seketika saat pasangan menambahkan foto instant, pin kenangan, wishlist, catatan, streak bertambah, atau membalas instantmu.
            </p>

            <div className="space-y-2 pt-1 border-t border-[#7A1018]/10">
              {/* Push Web Permission Button */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/80 dark:bg-white/5 border border-rose-200/40">
                <div>
                  <span className="font-bold block text-[#501522] dark:text-rose-100">Notifikasi Browser / OS (Web Push)</span>
                  <span className="text-[10px] text-gray-500 dark:text-rose-300/70">
                    Status: {pushStatus === 'granted' ? 'Diizinkan ✅' : pushStatus === 'denied' ? 'Ditolak (buka setelan browser) ❌' : 'Belum diaktifkan'}
                  </span>
                </div>
                {pushStatus !== 'granted' ? (
                  <button
                    type="button"
                    onClick={() => void handleRequestPush()}
                    className="px-3 py-1.5 text-[10px] font-extrabold bg-[#7A1018] text-white rounded-lg shadow-sm hover:bg-[#5e0a11] transition"
                  >
                    Aktifkan Izin
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    <Check className="h-3 w-3" /> Aktif
                  </span>
                )}
              </div>

              {/* In App Toast Switch */}
              <label className="flex items-center justify-between p-2 rounded-xl bg-white/40 dark:bg-white/5 cursor-pointer">
                <span className="font-medium text-[#501522] dark:text-rose-100">Banner Romantis Di Dalam Aplikasi (In-App Toast)</span>
                <input
                  type="checkbox"
                  checked={formData.notifications?.inAppToast ?? true}
                  onChange={(e) => updateNotificationSetting('inAppToast', e.target.checked)}
                  className="rounded text-[#7A1018]"
                />
              </label>

              {/* Notification Categories Grid */}
              <div className="pt-2">
                <span className="block text-[10px] font-extrabold text-[#7A1018] dark:text-[#F4B6C2] mb-1.5 uppercase">Kategori Notifikasi:</span>
                <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                  <label className="flex items-center gap-2 p-1.5 rounded-lg bg-white/40 dark:bg-white/5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.notifications?.notifyOnPhoto ?? true}
                      onChange={(e) => updateNotificationSetting('notifyOnPhoto', e.target.checked)}
                      className="rounded text-[#7A1018]"
                    />
                    <span>📸 Foto Instant</span>
                  </label>
                  <label className="flex items-center gap-2 p-1.5 rounded-lg bg-white/40 dark:bg-white/5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.notifications?.notifyOnReply ?? true}
                      onChange={(e) => updateNotificationSetting('notifyOnReply', e.target.checked)}
                      className="rounded text-[#7A1018]"
                    />
                    <span>💬 Balasan Chibi</span>
                  </label>
                  <label className="flex items-center gap-2 p-1.5 rounded-lg bg-white/40 dark:bg-white/5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.notifications?.notifyOnPin ?? true}
                      onChange={(e) => updateNotificationSetting('notifyOnPin', e.target.checked)}
                      className="rounded text-[#7A1018]"
                    />
                    <span>📍 Pin Kenangan</span>
                  </label>
                  <label className="flex items-center gap-2 p-1.5 rounded-lg bg-white/40 dark:bg-white/5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.notifications?.notifyOnWishlist ?? true}
                      onChange={(e) => updateNotificationSetting('notifyOnWishlist', e.target.checked)}
                      className="rounded text-[#7A1018]"
                    />
                    <span>💖 Wishlist Baru</span>
                  </label>
                  <label className="flex items-center gap-2 p-1.5 rounded-lg bg-white/40 dark:bg-white/5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.notifications?.notifyOnStreak ?? true}
                      onChange={(e) => updateNotificationSetting('notifyOnStreak', e.target.checked)}
                      className="rounded text-[#7A1018]"
                    />
                    <span>🔥 Streak & Temu</span>
                  </label>
                  <label className="flex items-center gap-2 p-1.5 rounded-lg bg-white/40 dark:bg-white/5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.notifications?.notifyOnNotes ?? true}
                      onChange={(e) => updateNotificationSetting('notifyOnNotes', e.target.checked)}
                      className="rounded text-[#7A1018]"
                    />
                    <span>📝 Catatan & Siklus</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {isAdminAccount && (
            <section className="rounded-2xl border border-amber-300/70 bg-amber-50/80 p-4 text-[#603e1e] shadow-inner dark:border-amber-200/20 dark:bg-amber-950/20 dark:text-amber-100">
              <h4 className="mb-2 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider">
                <ShieldAlert className="h-4 w-4" />
                Akses administrator terverifikasi
              </h4>
              <p className="mb-3 text-[10px] leading-relaxed opacity-80">
                Mode ini mengizinkan akun admin membaca dan mengubah check-in, foto diary, konfirmasi bertemu, dan progres hati kedua profil melalui Supabase. Pilih profil aktif dari menu profil setelah mengaktifkannya.
              </p>
              <button
                type="button"
                onClick={onToggleAdminMode}
                aria-pressed={adminMode}
                className={`min-h-10 rounded-xl px-4 py-2 text-xs font-extrabold text-white shadow-[0_3px_0_rgba(75,48,20,.25)] transition active:translate-y-0.5 active:shadow-none ${adminMode ? 'bg-rose-700 hover:bg-rose-800' : 'bg-amber-700 hover:bg-amber-800'}`}
              >
                {adminMode ? 'Nonaktifkan Mode Admin' : 'Aktifkan Mode Admin'}
              </button>
              <p className="mt-2 text-[9px] opacity-70" role="status">
                {adminMode ? 'Mode Admin aktif untuk sesi ini.' : 'Mode Admin nonaktif.'}
              </p>
              <p className="mt-2 text-[9px] leading-relaxed opacity-70">
                Data fitur lain yang hanya tersimpan di browser (localStorage) belum dipisahkan atau disinkronkan per profil.
              </p>
            </section>
          )}

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
