import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar as CalendarIcon,
  Shield,
  ShieldCheck,
  AlertTriangle,
  Plus,
  HelpCircle,
  Heart,
  Settings as SettingsIcon,
  ChevronRight,
  Info,
  Clock,
  MapPin,
  Smile,
  Lock,
  Share2,
  Pill
} from 'lucide-react';
import { CloseButton } from '../common/CloseButton';
import { CycleRecord, IntimateLog, MemoryPin, AppSettings, ProtectionType } from '../../types';
import { MoodBadge, MOOD_DEFINITIONS, AnimatedHeart } from '../common/AnimatedIcons';
import {
  calculateCycleStats,
  getDayStatus,
  checkIntimateHealthRisk,
  getIntimateStats,
  formatDateKey,
  parseDate
} from '../../utils/cycleCalculations';

interface FloCycleSectionProps {
  cycles: CycleRecord[];
  intimateLogs: IntimateLog[];
  pins: MemoryPin[];
  settings: AppSettings;
  onAddCycle: (cycle: CycleRecord) => void;
  onUpdateCycle: (cycle: CycleRecord) => void;
  onAddIntimateLog: (log: IntimateLog) => void;
  onDeleteIntimateLog: (id: string) => void;
  onOpenSettings: () => void;
  onWipeData: () => void;
}

export const FloCycleSection: React.FC<FloCycleSectionProps> = ({
  cycles,
  intimateLogs,
  pins,
  settings,
  onAddCycle,
  onUpdateCycle,
  onAddIntimateLog,
  onDeleteIntimateLog,
  onOpenSettings,
  onWipeData
}) => {
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  const [selectedDate, setSelectedDate] = useState<string>(formatDateKey(new Date()));
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isPeriodEditModalOpen, setIsPeriodEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'kalender' | 'ringkasan' | 'edukasi'>('kalender');

  // Form State for Intimate Log
  const [intimateForm, setIntimateForm] = useState<{
    date: string;
    time: string;
    protection: ProtectionType;
    protectionIssue: boolean;
    otherMethodDetails: string;
    mood: string;
    notes: string;
    pinId: string;
  }>({
    date: formatDateKey(new Date()),
    time: '23:00',
    protection: 'kondom',
    protectionIssue: false,
    otherMethodDetails: '',
    mood: 'romantis',
    notes: '',
    pinId: ''
  });

  // Form State for Period Record
  const [periodForm, setPeriodForm] = useState<{
    startDate: string;
    periodLength: number;
    flow: 'ringan' | 'sedang' | 'banyak';
    pain: 'tidak_ada' | 'ringan' | 'sedang' | 'parah';
    mood: string;
    notes: string;
  }>({
    startDate: formatDateKey(new Date()),
    periodLength: 5,
    flow: 'sedang',
    pain: 'ringan',
    mood: 'tenang',
    notes: ''
  });

  const stats = useMemo(() => calculateCycleStats(cycles), [cycles]);
  const healthAlerts = useMemo(() => checkIntimateHealthRisk(intimateLogs, cycles, stats), [intimateLogs, cycles, stats]);
  const intimateStats = useMemo(() => getIntimateStats(intimateLogs), [intimateLogs]);

  // Today string
  const todayStr = formatDateKey(new Date());

  // Months to render in vertical continuous scroll: August 2026 to December 2026 (or dynamic 6 months around today)
  const monthsToRender = useMemo(() => {
    const list = [];
    const baseDate = new Date();
    // 2 months past, current, 3 months future
    for (let offset = -2; offset <= 3; offset++) {
      const d = new Date(baseDate.getFullYear(), baseDate.getMonth() + offset, 1);
      list.push(d);
    }
    return list;
  }, []);

  const openLogModalForDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    setIntimateForm((prev) => ({
      ...prev,
      date: dateStr
    }));
    setIsLogModalOpen(true);
  };

  const handleSaveIntimateLog = (e: React.FormEvent) => {
    e.preventDefault();
    const newLog: IntimateLog = {
      id: 'intimate-' + Date.now(),
      date: intimateForm.date,
      time: intimateForm.time || undefined,
      protection: intimateForm.protection,
      protectionIssue: intimateForm.protection === 'kondom' ? intimateForm.protectionIssue : false,
      otherMethodDetails: intimateForm.protection === 'metode_lain' ? intimateForm.otherMethodDetails : undefined,
      mood: intimateForm.mood,
      notes: intimateForm.notes,
      pinId: intimateForm.pinId || undefined,
      createdAt: new Date().toISOString()
    };
    onAddIntimateLog(newLog);
    setIsLogModalOpen(false);
  };

  const handleSavePeriod = (e: React.FormEvent) => {
    e.preventDefault();
    const newCycle: CycleRecord = {
      id: 'cycle-' + Date.now(),
      startDate: periodForm.startDate,
      cycleLength: stats.averageCycleLength || 28,
      periodLength: periodForm.periodLength,
      flow: periodForm.flow,
      pain: periodForm.pain,
      mood: periodForm.mood,
      notes: periodForm.notes
    };
    onAddCycle(newCycle);
    setIsPeriodEditModalOpen(false);
  };

  return (
    <section id="siklus-intim" className="cycle-clay-section py-10 px-4 bg-[#fbf8f5] dark:bg-[#160305] border-b border-[#7A1018]/15 transition-colors sm:py-12">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6 text-center">
          <span className="mx-auto mb-2 inline-flex items-center gap-2 rounded-full bg-[#f5e0e2] px-3 py-1 font-sans-clean text-[10px] font-bold uppercase tracking-[0.18em] text-[#a94761] shadow-sm dark:bg-[#49353d] dark:text-rose-200">
            <CalendarIcon className="h-3.5 w-3.5" /> Kalender perawatan
          </span>
          <h1 className="font-sans-clean text-2xl font-extrabold text-[#43252d] dark:text-rose-50 sm:text-3xl">Siklus & Kasih</h1>
          <p className="mx-auto mt-1 max-w-lg text-xs leading-relaxed text-[#80646a] dark:text-rose-100/70 sm:text-sm">
            Catat kalender, lihat ringkasan, dan kelola privasi dalam satu tempat.
          </p>
        </header>
        {/* Flo-styled Top Bar */}
        <div className="cycle-clay-card bg-white dark:bg-[#200508] rounded-3xl p-4 sm:p-5 shadow-lg border border-[#7A1018]/15 mb-5">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/10">
            {/* View Mode Toggle: Bulan | Tahun */}
            <div className="inline-flex rounded-full bg-gray-100 dark:bg-black/30 p-1 text-xs font-sans-clean font-bold">
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-1.5 rounded-full transition ${
                  viewMode === 'month'
                    ? 'bg-[#7A1018] text-[#EFE6DA] shadow-sm'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                Bulan
              </button>
              <button
                onClick={() => setViewMode('year')}
                className={`px-4 py-1.5 rounded-full transition ${
                  viewMode === 'year'
                    ? 'bg-[#7A1018] text-[#EFE6DA] shadow-sm'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                Tahun
              </button>
            </div>

            {/* Title / Subheading */}
            <div className="text-center hidden sm:block">
              <div className="text-[10px] font-sans-clean font-bold tracking-[0.2em] text-[#7A1018] dark:text-[#F4B6C2] uppercase">
                PELACAK SIKLUS & LOG INTIM
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {settings.shareCycleWithPartner ? 'Dibagikan dengan Pasangan (Savero & Soffie)' : 'Privat Soffie'}
              </div>
            </div>

            {/* Quick Actions (Settings, Close) */}
            <div className="flex items-center space-x-2">
              <button
                onClick={onOpenSettings}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition"
                title="Pengaturan Siklus & Privasi"
              >
                <SettingsIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-[11px] sm:text-xs font-sans-clean">
            <button
              onClick={() => setActiveTab('kalender')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                activeTab === 'kalender'
                  ? 'bg-[#F4B6C2]/30 text-[#7A1018] dark:text-[#F4B6C2] border border-[#F4B6C2]'
                  : 'text-gray-500 hover:text-black dark:text-gray-400'
              }`}
            >
              Kalender Vertikal
            </button>
            <button
              onClick={() => setActiveTab('ringkasan')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                activeTab === 'ringkasan'
                  ? 'bg-[#F4B6C2]/30 text-[#7A1018] dark:text-[#F4B6C2] border border-[#F4B6C2]'
                  : 'text-gray-500 hover:text-black dark:text-gray-400'
              }`}
            >
              Ringkasan & Statistik
            </button>
            <button
              onClick={() => setActiveTab('edukasi')}
              className={`px-3 py-1 rounded-lg font-bold transition relative ${
                activeTab === 'edukasi'
                  ? 'bg-[#F4B6C2]/30 text-[#7A1018] dark:text-[#F4B6C2] border border-[#F4B6C2]'
                  : 'text-gray-500 hover:text-black dark:text-gray-400'
              }`}
            >
              Informasi Medis & Kesehatan
              {healthAlerts.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#7A1018] absolute -top-1 -right-1" />
              )}
            </button>
          </div>
        </div>

        {/* Tab 1: Kalender (Bulan & Tahun) */}
        {activeTab === 'kalender' && (
          <div className="cycle-clay-card bg-white dark:bg-[#200508] rounded-3xl p-4 sm:p-6 shadow-md border border-[#7A1018]/15 relative">
            {/* Legend / Shape Guide (Dibedakan bentuk, bukan hanya warna) */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-[11px] font-sans-clean font-medium pb-4 mb-6 border-b border-gray-100 dark:border-white/10">
              <div className="flex items-center space-x-1.5">
                <span className="w-4 h-4 rounded-full bg-[#F4B6C2] text-white flex items-center justify-center text-[9px] font-bold">
                  ●
                </span>
                <span className="text-gray-600 dark:text-gray-300">Haid Tercatat</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-4 h-4 rounded-full border-2 border-dashed border-[#F4B6C2] text-[#F4B6C2] flex items-center justify-center text-[9px]">
                  ○
                </span>
                <span className="text-gray-600 dark:text-gray-300">Prediksi Haid</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="text-teal-600 dark:text-teal-400 font-bold">14</span>
                <span className="text-gray-600 dark:text-gray-300">Masa Subur</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-4 h-4 rounded-full border-2 border-dashed border-teal-500 flex items-center justify-center text-[9px] text-teal-600">
                  ○
                </span>
                <span className="text-gray-600 dark:text-gray-300">Prediksi Ovulasi</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Heart className="w-3.5 h-3.5 text-[#7A1018] fill-[#7A1018]" />
                <span className="text-gray-600 dark:text-gray-300">Hubungan Intim</span>
              </div>
            </div>

            {/* Continuous Vertical Scroll of Months */}
            {viewMode === 'month' ? (
              <div className="cycle-month-stack space-y-10 max-h-[600px] overflow-y-auto pr-2 scrollbar-none">
                {monthsToRender.map((monthDate, mIdx) => {
                  const monthName = monthDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
                  const year = monthDate.getFullYear();
                  const month = monthDate.getMonth();

                  // Days in month
                  const daysCount = new Date(year, month + 1, 0).getDate();
                  // Day of week for 1st of month: 0=Sun, 1=Mon, ..., 6=Sat
                  // Flo style starts on Monday (S, S, R, K, J, S, M)
                  const firstDay = new Date(year, month, 1).getDay();
                  const leadingBlanks = (firstDay + 6) % 7; // Monday index 0

                  const days = Array.from({ length: daysCount }, (_, i) => i + 1);

                  return (
                    <div key={mIdx} className="border-b border-gray-100 dark:border-white/5 pb-8 last:border-none">
                      {/* Month Separator Header */}
                      <h3 className="font-serif-title text-xl font-bold text-[#7A1018] dark:text-[#F4B6C2] mb-4 text-center">
                        {monthName}
                      </h3>

                      {/* Day of Week Header: Single letters as Flo */}
                      <div className="grid grid-cols-7 gap-1 text-center font-sans-clean font-bold text-xs text-gray-400 mb-2">
                        <span>S</span>
                        <span>S</span>
                        <span>R</span>
                        <span>K</span>
                        <span>J</span>
                        <span>S</span>
                        <span>M</span>
                      </div>

                      {/* Days Grid */}
                      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                        {Array.from({ length: leadingBlanks }).map((_, bIdx) => (
                          <div key={`blank-${bIdx}`} className="h-14 sm:h-16" />
                        ))}

                        {days.map((dayNum) => {
                          const dateObj = new Date(year, month, dayNum);
                          const dateStr = formatDateKey(dateObj);
                          const isToday = dateStr === todayStr;
                          const status = getDayStatus(dateObj, cycles, intimateLogs, stats);

                          return (
                            <button
                              key={dayNum}
                              type="button"
                              onClick={() => openLogModalForDate(dateStr)}
                              className={`relative h-14 sm:h-16 rounded-xl flex flex-col items-center justify-between p-1 transition border ${
                                isToday
                                  ? 'border-[#7A1018] bg-[#7A1018]/5 dark:bg-white/5 font-bold shadow-xs'
                                  : 'border-transparent hover:border-gray-200 dark:hover:border-white/10'
                              }`}
                            >
                              {/* Label "HARI INI" on today */}
                              {isToday && (
                                <span className="text-[7px] font-sans-clean font-black tracking-tighter text-[#7A1018] dark:text-[#F4B6C2] uppercase">
                                  HARI INI
                                </span>
                              )}

                              {/* Date Number with Flo Visual Codings */}
                              <div
                                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                                  status.isRecordedPeriod
                                    ? 'bg-[#F4B6C2] text-white shadow-sm' // Haid tercatat: lingkaran penuh pink, angka putih
                                    : status.isPredictedPeriod
                                    ? 'border-2 border-dashed border-[#F4B6C2] text-[#F4B6C2]' // Haid prediksi: lingkaran putus pink, angka pink
                                    : status.isOvulation
                                    ? 'border-2 border-dashed border-teal-500 text-teal-700 dark:text-teal-300' // Ovulasi prediksi: lingkaran putus teal
                                    : status.isFertile
                                    ? 'text-teal-600 dark:text-teal-300 font-bold' // Masa subur: angka teal tanpa lingkaran
                                    : 'text-gray-700 dark:text-gray-300'
                                }`}
                              >
                                {dayNum}
                              </div>

                              {/* Hubungan Intim Badge Under Date */}
                              <div className="h-4 flex items-center justify-center space-x-0.5">
                                {status.intimateLogs.map((log) => {
                                  // Distinct badges as required
                                  if (log.protection === 'kondom') {
                                    return (
                                      <span
                                        key={log.id}
                                        className="relative inline-flex items-center text-[#7A1018]"
                                        title={log.protectionIssue ? 'Kondom bermasalah' : 'Pakai Kondom (Aman)'}
                                      >
                                        <Heart className="w-3.5 h-3.5 fill-[#7A1018] text-[#7A1018]" />
                                        <Shield className="w-2 h-2 text-white absolute inset-0 m-auto" />
                                      </span>
                                    );
                                  }
                                  if (log.protection === 'tanpa_pengaman') {
                                    return (
                                      <span
                                        key={log.id}
                                        className="relative inline-flex items-center text-red-600 animate-pulse"
                                        title="Tanpa Pengaman"
                                      >
                                        <Heart className="w-3.5 h-3.5 fill-red-600 text-red-700 ring-1 ring-red-400 rounded-full" />
                                        <span className="text-[7px] text-white font-black absolute inset-0 flex items-center justify-center">
                                          !
                                        </span>
                                      </span>
                                    );
                                  }
                                  if (log.protection === 'metode_lain') {
                                    return (
                                      <span
                                        key={log.id}
                                        className="relative inline-flex items-center text-blue-600"
                                        title={`Metode Lain: ${log.otherMethodDetails || 'KB'}`}
                                      >
                                        <Heart className="w-3.5 h-3.5 fill-blue-500 text-blue-600" />
                                        <Plus className="w-2 h-2 text-white absolute inset-0 m-auto" />
                                      </span>
                                    );
                                  }
                                  return (
                                    <span key={log.id} className="text-gray-400" title="Tidak Ingat">
                                      <Heart className="w-3.5 h-3.5 fill-gray-400 text-gray-400" />
                                    </span>
                                  );
                                })}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Year View: 12 Mini Month Grids */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 py-4">
                {Array.from({ length: 12 }).map((_, mIdx) => {
                  const currentYear = new Date().getFullYear();
                  const mDate = new Date(currentYear, mIdx, 1);
                  const mName = mDate.toLocaleDateString('id-ID', { month: 'short' });
                  const daysInM = new Date(currentYear, mIdx + 1, 0).getDate();

                  return (
                    <div
                      key={mIdx}
                      className="p-3 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-white/5"
                    >
                      <h4 className="text-xs font-bold text-[#7A1018] dark:text-[#F4B6C2] mb-2 font-serif-title">
                        {mName}
                      </h4>
                      <div className="grid grid-cols-7 gap-0.5 text-[8px]">
                        {Array.from({ length: daysInM }).map((_, dIdx) => {
                          const dateObj = new Date(currentYear, mIdx, dIdx + 1);
                          const status = getDayStatus(dateObj, cycles, intimateLogs, stats);

                          let dotColor = 'bg-gray-200 dark:bg-gray-700';
                          if (status.isRecordedPeriod) dotColor = 'bg-[#F4B6C2]';
                          else if (status.isPredictedPeriod) dotColor = 'bg-[#F4B6C2]/60 ring-1 ring-[#F4B6C2]';
                          else if (status.isOvulation) dotColor = 'bg-teal-500';
                          else if (status.isFertile) dotColor = 'bg-teal-300';

                          return (
                            <div
                              key={dIdx}
                              className={`w-2.5 h-2.5 rounded-full mx-auto ${dotColor}`}
                              title={`${dIdx + 1} ${mName}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Floating Action Button at Bottom: "Edit tanggal periode haid" */}
            <div className="sticky bottom-2 mt-6 flex flex-wrap items-center justify-between gap-3 bg-white/95 dark:bg-[#200508]/95 p-3 rounded-2xl border border-[#7A1018]/20 shadow-xl backdrop-blur-md">
              <button
                type="button"
                onClick={() => {
                  setPeriodForm({
                    startDate: todayStr,
                    periodLength: stats.averagePeriodLength || 5,
                    flow: 'sedang',
                    pain: 'ringan',
                    mood: '😊 Tenang',
                    notes: ''
                  });
                  setIsPeriodEditModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-[#F4B6C2] hover:bg-[#e99ba9] text-[#7A1018] font-bold text-xs font-sans-clean transition shadow-sm flex items-center space-x-2"
              >
                <CalendarIcon className="w-4 h-4" />
                <span>Edit Tanggal Periode Haid</span>
              </button>

              <button
                type="button"
                onClick={() => openLogModalForDate(todayStr)}
                className="px-4 py-2.5 rounded-xl bg-[#7A1018] hover:bg-[#5e0a11] text-[#EFE6DA] font-bold text-xs font-sans-clean transition shadow-sm flex items-center space-x-2"
              >
                <Heart className="w-4 h-4 fill-current" />
                <span>Catat Hubungan Hari Ini</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Ringkasan & Statistik Privat */}
        {activeTab === 'ringkasan' && (
          <div className="cycle-clay-card bg-white dark:bg-[#200508] rounded-3xl p-4 sm:p-6 shadow-md border border-[#7A1018]/15 space-y-6">
            <div>
              <h3 className="font-serif-title text-xl font-bold text-[#7A1018] dark:text-[#F4B6C2]">
                Ringkasan Siklus & Log Intim
              </h3>
              <p className="text-xs text-gray-500 font-sans-clean mt-1">
                Data privat per siklus dan per bulan untuk pemahaman kesehatan bersama tanpa peringkat.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-[#EFE6DA]/40 dark:bg-black/30 border border-[#7A1018]/10 text-center">
                <span className="text-[10px] uppercase font-bold text-gray-500 block font-sans-clean">
                  Rata-rata Siklus
                </span>
                <span className="text-2xl font-bold text-[#7A1018] dark:text-[#F4B6C2] font-serif-title">
                  {stats.averageCycleLength} Hari
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-[#EFE6DA]/40 dark:bg-black/30 border border-[#7A1018]/10 text-center">
                <span className="text-[10px] uppercase font-bold text-gray-500 block font-sans-clean">
                  Durasi Haid
                </span>
                <span className="text-2xl font-bold text-[#7A1018] dark:text-[#F4B6C2] font-serif-title">
                  {stats.averagePeriodLength} Hari
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-[#EFE6DA]/40 dark:bg-black/30 border border-[#7A1018]/10 text-center">
                <span className="text-[10px] uppercase font-bold text-gray-500 block font-sans-clean">
                  Tingkat Pengaman
                </span>
                <span className="text-2xl font-bold text-teal-600 dark:text-teal-400 font-serif-title">
                  {intimateStats.protectedRate}%
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-[#EFE6DA]/40 dark:bg-black/30 border border-[#7A1018]/10 text-center">
                <span className="text-[10px] uppercase font-bold text-gray-500 block font-sans-clean">
                  Total Log Intim
                </span>
                <span className="text-2xl font-bold text-[#3B0A0F] dark:text-[#EFE6DA] font-serif-title">
                  {intimateStats.total} Kali
                </span>
              </div>
            </div>

            {/* List of Intimate Logs with Delete & Details */}
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/10">
              <h4 className="font-serif-title font-bold text-base text-[#3B0A0F] dark:text-[#EFE6DA] mb-3">
                Riwayat Catatan Intim
              </h4>

              {intimateLogs.length === 0 ? (
                <p className="text-xs text-gray-400 font-sans-clean italic">Belum ada catatan hubungan intim.</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {intimateLogs.map((log) => {
                    const linkedPin = pins.find((p) => p.id === log.pinId);
                    return (
                      <div
                        key={log.id}
                        className="p-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/5 flex items-center justify-between text-xs font-sans-clean"
                      >
                        <div className="flex items-center space-x-3">
                          <MoodBadge moodKey={log.mood || 'romantis'} />
                          <div>
                            <div className="font-bold text-[#3B0A0F] dark:text-[#EFE6DA]">
                              {log.date} {log.time ? `• ${log.time}` : ''}
                            </div>
                            <div className="text-[11px] text-gray-500 flex items-center flex-wrap gap-1 mt-0.5">
                              <span>Metode: <strong>{log.protection}</strong></span>
                              {log.protectionIssue && (
                                <span className="inline-flex items-center text-red-600 font-bold bg-red-100 dark:bg-red-950/40 px-1.5 py-0.5 rounded text-[10px]">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  Ada kendala/bocor
                                </span>
                              )}
                              {log.notes ? <span>— "{log.notes}"</span> : null}
                              {linkedPin ? <span>• Lokasi: {linkedPin.title}</span> : null}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            if (confirm('Hapus log intim tanggal ' + log.date + '?')) {
                              onDeleteIntimateLog(log.id);
                            }
                          }}
                          className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded"
                        >
                          Hapus
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Privacy Wipe Button */}
            <div className="pt-4 border-t border-gray-100 dark:border-white/10 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Penyimpanan lokal di perangkat ini terenkripsi.
              </span>
              <button
                onClick={() => {
                  if (confirm('PERINGATAN: Hapus permanen seluruh riwayat siklus & log intim?')) {
                    onWipeData();
                  }
                }}
                className="text-xs text-red-600 hover:underline font-bold"
              >
                Hapus Semua Data Siklus & Intim
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Kartu Informasi Medis & Kesehatan Netral */}
        {activeTab === 'edukasi' && (
          <div className="cycle-clay-card bg-white dark:bg-[#200508] rounded-3xl p-4 sm:p-6 shadow-md border border-[#7A1018]/15 space-y-5 font-sans-clean text-xs">
            <div className="flex items-center space-x-2 text-[#7A1018] dark:text-[#F4B6C2]">
              <Info className="w-5 h-5 flex-shrink-0" />
              <h3 className="font-serif-title text-xl font-bold">
                Informasi Kesehatan & Panduan Netral
              </h3>
            </div>

            {/* If there are health risk alerts */}
            {healthAlerts.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 space-y-2">
                <div className="flex items-center space-x-2 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Catatan Perhatian Khusus:</span>
                </div>
                <ul className="list-disc list-inside space-y-1">
                  {healthAlerts.map((alert, idx) => (
                    <li key={idx}>
                      Tanggal {alert.log.date}: {alert.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-white/5 space-y-2">
                <h4 className="font-bold text-[#7A1018] dark:text-[#F4B6C2] text-sm flex items-center space-x-1.5">
                  <Shield className="w-4 h-4" />
                  <span>Kontrasepsi Darurat (Morning-After Pill)</span>
                </h4>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Bila terjadi hubungan intim tanpa pengaman atau kondom robek di masa subur, kontrasepsi darurat (seperti Levonorgestrel) paling efektif diminum <strong>sedini mungkin</strong> (terbaik dalam 24 jam, maksimal 72-120 jam tergantung jenis). Konsultasikan dengan apoteker atau dokter terdekat.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-white/5 space-y-2">
                <h4 className="font-bold text-[#7A1018] dark:text-[#F4B6C2] text-sm flex items-center space-x-1.5">
                  <CalendarIcon className="w-4 h-4" />
                  <span>Waktu Tes Kehamilan yang Akurat</span>
                </h4>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Tes kehamilan menggunakan testpack urine paling akurat dilakukan mulai dari <strong>hari pertama setelah terlambat haid</strong>, menggunakan urine pertama di pagi hari karena konsentrasi hormon hCG berada pada titik tertinggi.
                </p>
              </div>
            </div>

            {/* Health Center Nearby Semarang Links */}
            <div className="p-4 rounded-2xl bg-[#EFE6DA]/40 dark:bg-black/30 border border-[#7A1018]/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h5 className="font-bold text-[#3B0A0F] dark:text-[#EFE6DA]">
                  Layanan Kesehatan & Rumah Sakit Terdekat di Semarang
                </h5>
                <p className="text-gray-500 text-[11px]">
                  RSND Undip Tembalang, RS Kariadi Semarang, atau Apotek K-24 / Kimia Farma terdekat.
                </p>
              </div>
              <a
                href="https://www.google.com/maps/search/Apotek+dan+Rumah+Sakit+terdekat+Semarang"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-[#7A1018] text-[#EFE6DA] rounded-xl font-bold text-xs whitespace-nowrap hover:bg-[#5e0a11] transition"
              >
                Cari Layanan Kesehatan &rarr;
              </a>
            </div>

            {/* Permanent Medical Disclaimer as required */}
            <div className="p-3 rounded-xl bg-gray-100 dark:bg-black/40 text-[10px] text-gray-500 leading-relaxed">
              <strong>DISCLAIMER MEDIS:</strong> Kalender ini dan perkiraan masa subur/ovulasi adalah perkiraan matematis berbasis kalender dan BUKAN alat kontrasepsi yang pasti atau pengganti diagnosis medis klinis. Siklus dapat dipengaruhi stres, kelelahan, dan hormon. Selalu gunakan perlindungan ganda untuk kesehatan bersama.
            </div>
          </div>
        )}

        {/* Modal: Log Hubungan Intim */}
        <AnimatePresence>
          {isLogModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0, y: 25 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 25 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="bg-[#EFE6DA] dark:bg-[#250709] max-w-md w-full rounded-3xl p-6 border border-[#7A1018]/30 shadow-2xl my-8"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#7A1018]/15 mb-4">
                  <div className="flex items-center space-x-2">
                    <Heart className="w-5 h-5 text-[#7A1018] fill-current" />
                    <h3 className="font-serif-title text-xl font-bold text-[#7A1018] dark:text-[#F4B6C2]">
                      Catat Hubungan Intim
                    </h3>
                  </div>
                  <CloseButton onClick={() => setIsLogModalOpen(false)} />
                </div>

              <form onSubmit={handleSaveIntimateLog} className="space-y-4 font-sans-clean text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1 text-[#3B0A0F] dark:text-[#EFE6DA]">
                      Tanggal *
                    </label>
                    <input
                      type="date"
                      required
                      value={intimateForm.date}
                      onChange={(e) => setIntimateForm({ ...intimateForm, date: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/30 border border-[#7A1018]/20"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1 text-[#3B0A0F] dark:text-[#EFE6DA]">
                      Jam (Opsional)
                    </label>
                    <input
                      type="time"
                      value={intimateForm.time}
                      onChange={(e) => setIntimateForm({ ...intimateForm, time: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/30 border border-[#7A1018]/20"
                    />
                  </div>
                </div>

                {/* Pengaman (Wajib, 1 Pilihan) */}
                <div>
                  <label className="block font-bold mb-1.5 text-[#3B0A0F] dark:text-[#EFE6DA]">
                    Pengaman Digunakan *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'kondom', label: 'Pakai Kondom', icon: ShieldCheck, color: 'text-emerald-600' },
                      { id: 'tanpa_pengaman', label: 'Tanpa Pengaman', icon: AlertTriangle, color: 'text-rose-600' },
                      { id: 'metode_lain', label: 'Metode Lain (Pil/IUD)', icon: Pill, color: 'text-indigo-600' },
                      { id: 'tidak_ingat', label: 'Tidak Ingat', icon: HelpCircle, color: 'text-gray-500' }
                    ].map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = intimateForm.protection === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setIntimateForm({ ...intimateForm, protection: opt.id as ProtectionType })}
                          className={`p-2.5 rounded-xl border text-left font-medium transition flex items-center space-x-2.5 ${
                            isSelected
                              ? 'bg-[#7A1018] text-[#EFE6DA] border-[#7A1018] font-bold shadow-sm'
                              : 'bg-white dark:bg-black/30 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-[#7A1018]/30'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : opt.color}`} />
                          <span className="text-xs">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* If Kondom: Option Ada Masalah */}
                {intimateForm.protection === 'kondom' && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                    <label className="flex items-center space-x-2 cursor-pointer font-bold text-red-900 dark:text-red-200 text-xs">
                      <input
                        type="checkbox"
                        checked={intimateForm.protectionIssue}
                        onChange={(e) => setIntimateForm({ ...intimateForm, protectionIssue: e.target.checked })}
                        className="rounded text-red-600 focus:ring-red-500"
                      />
                      <span>Ada masalah pada kondom (robek, lepas, bocor)?</span>
                    </label>
                  </div>
                )}

                {/* If Metode Lain */}
                {intimateForm.protection === 'metode_lain' && (
                  <div>
                    <label className="block font-bold mb-1 text-[#3B0A0F] dark:text-[#EFE6DA]">
                      Keterangan Metode (Pil KB, IUD, Suntik, dll.)
                    </label>
                    <input
                      type="text"
                      value={intimateForm.otherMethodDetails}
                      onChange={(e) => setIntimateForm({ ...intimateForm, otherMethodDetails: e.target.value })}
                      placeholder="Contoh: Pil KB rutin"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/30 border border-[#7A1018]/20"
                    />
                  </div>
                )}

                {/* Mood Selection (Vector & Animated Icons, Zero Emojis) */}
                <div>
                  <label className="block font-bold mb-1.5 text-[#3B0A0F] dark:text-[#EFE6DA]">
                    Suasana Hati / Mood
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(MOOD_DEFINITIONS).map(([key, def]) => {
                      const Icon = def.icon;
                      const isSelected = intimateForm.mood === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setIntimateForm({ ...intimateForm, mood: key })}
                          className={`p-2 rounded-xl border text-xs font-sans-clean font-bold flex items-center space-x-2 transition ${
                            isSelected
                              ? 'bg-[#7A1018] text-[#EFE6DA] border-[#7A1018] shadow-xs'
                              : 'bg-white dark:bg-black/30 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-[#7A1018]/30'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span className="truncate">{def.label.split('&')[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Link to Map Pin */}
                <div>
                  <label className="block font-bold mb-1 text-[#3B0A0F] dark:text-[#EFE6DA]">
                    Tautan Lokasi Kenangan di Peta (Opsional)
                  </label>
                  <select
                    value={intimateForm.pinId}
                    onChange={(e) => setIntimateForm({ ...intimateForm, pinId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/30 border border-[#7A1018]/20"
                  >
                    <option value="">-- Tanpa Tautan Lokasi --</option>
                    {pins.map((pin) => (
                      <option key={pin.id} value={pin.id}>
                        {pin.title} ({pin.category})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="block font-bold mb-1 text-[#3B0A0F] dark:text-[#EFE6DA]">
                    Catatan Bebas
                  </label>
                  <textarea
                    rows={2}
                    value={intimateForm.notes}
                    onChange={(e) => setIntimateForm({ ...intimateForm, notes: e.target.value })}
                    placeholder="Momen hangat, rasa kasih, atau catatan khusus..."
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/30 border border-[#7A1018]/20"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-[#7A1018]/15">
                  <button
                    type="button"
                    onClick={() => setIsLogModalOpen(false)}
                    className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#7A1018] hover:bg-[#5e0a11] text-[#EFE6DA] rounded-xl font-bold"
                  >
                    Simpan Catatan
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Edit Tanggal Periode Haid */}
      <AnimatePresence>
        {isPeriodEditModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 25 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 25 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-[#EFE6DA] dark:bg-[#250709] max-w-md w-full rounded-3xl p-6 border border-[#7A1018]/30 shadow-2xl my-8"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#7A1018]/15 mb-4">
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="w-5 h-5 text-[#F4B6C2]" />
                  <h3 className="font-serif-title text-xl font-bold text-[#7A1018] dark:text-[#F4B6C2]">
                    Catat Periode Haid
                  </h3>
                </div>
                <CloseButton onClick={() => setIsPeriodEditModalOpen(false)} />
              </div>

              <form onSubmit={handleSavePeriod} className="space-y-4 font-sans-clean text-xs">
                <div>
                  <label className="block font-bold mb-1 text-[#3B0A0F] dark:text-[#EFE6DA]">
                    Tanggal Mulai Haid *
                  </label>
                  <input
                    type="date"
                    required
                    value={periodForm.startDate}
                    onChange={(e) => setPeriodForm({ ...periodForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/30 border border-[#7A1018]/20"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-[#3B0A0F] dark:text-[#EFE6DA]">
                    Durasi Haid (Hari)
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={12}
                    value={periodForm.periodLength}
                    onChange={(e) => setPeriodForm({ ...periodForm, periodLength: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/30 border border-[#7A1018]/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1 text-[#3B0A0F] dark:text-[#EFE6DA]">
                      Aliran (Flow)
                    </label>
                    <select
                      value={periodForm.flow}
                      onChange={(e) => setPeriodForm({ ...periodForm, flow: e.target.value as 'ringan' | 'sedang' | 'banyak' })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/30 border border-[#7A1018]/20"
                    >
                      <option value="ringan">Ringan</option>
                      <option value="sedang">Sedang</option>
                      <option value="banyak">Banyak</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold mb-1 text-[#3B0A0F] dark:text-[#EFE6DA]">
                      Nyeri / Kram
                    </label>
                    <select
                      value={periodForm.pain}
                      onChange={(e) => setPeriodForm({ ...periodForm, pain: e.target.value as 'tidak_ada' | 'ringan' | 'sedang' | 'parah' })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/30 border border-[#7A1018]/20"
                    >
                      <option value="tidak_ada">Tidak Ada Nyeri</option>
                      <option value="ringan">Ringan</option>
                      <option value="sedang">Sedang</option>
                      <option value="parah">Kram Parah</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-[#3B0A0F] dark:text-[#EFE6DA]">
                    Catatan Khusus
                  </label>
                  <textarea
                    rows={2}
                    value={periodForm.notes}
                    onChange={(e) => setPeriodForm({ ...periodForm, notes: e.target.value })}
                    placeholder="Minum air hangat, kompres perut oleh Savero, dll..."
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/30 border border-[#7A1018]/20"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-[#7A1018]/15">
                  <button
                    type="button"
                    onClick={() => setIsPeriodEditModalOpen(false)}
                    className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#7A1018] hover:bg-[#5e0a11] text-[#EFE6DA] rounded-xl font-bold"
                  >
                    Simpan Periode
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </section>
  );
};
