import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar as CalendarIcon,
  Shield,
  ShieldCheck,
  AlertTriangle,
  Plus,
  HelpCircle,
  Heart,
  ChevronRight,
  ChevronLeft,
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
import { soundManager } from '../../utils/audio';
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
  canEdit: boolean;
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
  canEdit,
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
  const [isDayActionModalOpen, setIsDayActionModalOpen] = useState(false);
  const [editingCycleId, setEditingCycleId] = useState<string | null>(null);
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
    fertileStartDate: string;
    fertileEndDate: string;
    ovulationDate: string;
    periodLength: number;
    flow: 'ringan' | 'sedang' | 'banyak';
    pain: 'tidak_ada' | 'ringan' | 'sedang' | 'parah';
    mood: string;
    notes: string;
  }>({
    startDate: formatDateKey(new Date()),
    fertileStartDate: '',
    fertileEndDate: '',
    ovulationDate: '',
    periodLength: 5,
    flow: 'sedang',
    pain: 'ringan',
    mood: 'tenang',
    notes: ''
  });

  useEffect(() => {
    if (!canEdit) {
      setIsLogModalOpen(false);
      setIsPeriodEditModalOpen(false);
      setIsDayActionModalOpen(false);
    }
  }, [canEdit]);

  const stats = useMemo(() => calculateCycleStats(cycles), [cycles]);
  const healthAlerts = useMemo(() => checkIntimateHealthRisk(intimateLogs, cycles, stats), [intimateLogs, cycles, stats]);
  const intimateStats = useMemo(() => getIntimateStats(intimateLogs), [intimateLogs]);

  // Today string
  const todayStr = formatDateKey(new Date());

  // Active month state for calendar view (always initializes to current month so user opens right on current month)
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const goToPreviousMonth = () => {
    soundManager.playTap();
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    soundManager.playTap();
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToCurrentMonth = () => {
    soundManager.playTap();
    const now = new Date();
    setCurrentMonthDate(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const isViewingCurrentMonth = useMemo(() => {
    const now = new Date();
    return (
      currentMonthDate.getFullYear() === now.getFullYear() &&
      currentMonthDate.getMonth() === now.getMonth()
    );
  }, [currentMonthDate]);

  const openLogModalForDate = (dateStr: string) => {
    if (!canEdit) return;
    soundManager.playTap();
    setSelectedDate(dateStr);
    setIntimateForm({ date: dateStr, time: '23:00', protection: 'kondom', protectionIssue: false, otherMethodDetails: '', mood: 'romantis', notes: '', pinId: '' });
    setIsLogModalOpen(true);
  };

  const openDayActions = (dateStr: string) => {
    if (!canEdit) return;
    soundManager.playTap();
    setSelectedDate(dateStr);
    setIsDayActionModalOpen(true);
  };

  const openPeriodEditorForDate = (dateStr: string) => {
    soundManager.playTap();
    const existing = cycles.find((cycle) => {
      const dayOffset = Math.round((parseDate(dateStr).getTime() - parseDate(cycle.startDate).getTime()) / 86400000);
      const inPeriod = dayOffset >= 0 && dayOffset < (cycle.periodLength || stats.averagePeriodLength || 5);
      const inFertileWindow = Boolean(cycle.fertileStartDate && cycle.fertileEndDate && dateStr >= cycle.fertileStartDate && dateStr <= cycle.fertileEndDate);
      return cycle.startDate === dateStr || inPeriod || inFertileWindow;
    });
    const startDate = existing?.startDate ?? dateStr;
    const ovulationDate = existing?.ovulationDate ?? formatDateKey(new Date(parseDate(startDate).getTime() + (stats.averageCycleLength - 14) * 86400000));
    const fertileStartDate = existing?.fertileStartDate ?? formatDateKey(new Date(parseDate(ovulationDate).getTime() - 5 * 86400000));
    setEditingCycleId(existing?.id ?? null);
    setPeriodForm({
      startDate,
      fertileStartDate,
      fertileEndDate: existing?.fertileEndDate ?? ovulationDate,
      ovulationDate,
      periodLength: existing?.periodLength ?? stats.averagePeriodLength ?? 5,
      flow: existing?.flow ?? 'sedang',
      pain: existing?.pain ?? 'ringan',
      mood: existing?.mood ?? 'tenang',
      notes: existing?.notes ?? ''
    });
    setIsDayActionModalOpen(false);
    setIsPeriodEditModalOpen(true);
  };

  const handleSaveIntimateLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
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
    soundManager.playChime();
    setIsLogModalOpen(false);
  };

  const handleSavePeriod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    if (periodForm.fertileStartDate && periodForm.fertileEndDate && periodForm.fertileEndDate < periodForm.fertileStartDate) {
      window.alert('Tanggal akhir masa subur harus setelah tanggal mulai.');
      return;
    }
    const newCycle: CycleRecord = {
      id: editingCycleId ?? 'cycle-' + Date.now(),
      startDate: periodForm.startDate,
      endDate: formatDateKey(new Date(parseDate(periodForm.startDate).getTime() + (periodForm.periodLength - 1) * 86400000)),
      fertileStartDate: periodForm.fertileStartDate || undefined,
      fertileEndDate: periodForm.fertileEndDate || undefined,
      ovulationDate: periodForm.ovulationDate || undefined,
      cycleLength: stats.averageCycleLength || 28,
      periodLength: periodForm.periodLength,
      flow: periodForm.flow,
      pain: periodForm.pain,
      mood: periodForm.mood,
      notes: periodForm.notes
    };
    if (editingCycleId) onUpdateCycle(newCycle);
    else onAddCycle(newCycle);
    soundManager.playChime();
    setEditingCycleId(null);
    setIsPeriodEditModalOpen(false);
  };

  return (
    <section id="siklus-intim" className="cycle-clay-section py-6 px-3 sm:py-8 sm:px-4 bg-[#fbf8f5] dark:bg-[#160305] border-b border-[#7A1018]/15 transition-colors">
      <div className="max-w-4xl mx-auto">
        <header className="mb-4 flex items-center justify-between gap-3 text-left">
          <div className="min-w-0 flex-1">
            <span className="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-[#f5e0e2] px-2.5 py-0.5 font-sans-clean text-[10px] font-bold uppercase tracking-[0.16em] text-[#a94761] shadow-2xs dark:bg-[#49353d] dark:text-rose-200">
              <CalendarIcon className="h-3 w-3" /> Kalender perawatan
            </span>
            <h1 className="font-sans-clean text-xl sm:text-2xl md:text-3xl font-extrabold text-[#43252d] dark:text-rose-50">
              Siklus & Kasih
            </h1>
            <p className="mt-0.5 max-w-md text-[11px] sm:text-xs leading-relaxed text-[#5c2432] dark:text-rose-200">
              Catat kalender, lihat ringkasan, dan kelola privasi dalam satu tempat.
            </p>
            {!canEdit && (
              <div className="mt-2 inline-flex items-center gap-2 rounded-xl border border-[#e7c2c8] bg-white/75 px-2.5 py-1 text-[10.5px] text-[#704b54] shadow-2xs dark:border-white/10 dark:bg-white/5 dark:text-rose-100/75">
                <img src="/characters/expressions/soffie/gemas-sayang.webp" alt="" loading="lazy" decoding="async" className="h-6 w-4.5 object-contain" />
                <span>Mode lihat — pencatatan hanya di profil Soffie.</span>
              </div>
            )}
          </div>

          <div className="shrink-0">
            <img
              src="/characters/berdua/Chibi Comfort During Stomach Pain.webp"
              alt="Chibi Comfort During Stomach Pain"
              loading="lazy"
              decoding="async"
              className="h-28 w-28 sm:h-36 sm:w-36 md:h-44 md:w-44 object-contain drop-shadow-xl hover:scale-105 transition-transform duration-300"
            />
          </div>
        </header>

        {/* Compact Clean Navigation Bar */}
        <div className="cycle-clay-card mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#7A1018]/15 bg-white/90 p-1.5 shadow-xs backdrop-blur-xs dark:border-white/10 dark:bg-[#200508]/90 sm:p-2">
          {/* Main Navigation Tabs */}
          <div className="flex items-center gap-1 text-[11px] font-sans-clean font-bold">
            <button
              type="button"
              onClick={() => {
                soundManager.playTap();
                setActiveTab('kalender');
              }}
              className={`rounded-xl px-2.5 py-1 sm:px-3 sm:py-1.5 transition-all ${
                activeTab === 'kalender'
                  ? 'bg-gradient-to-r from-[#FF5C77] to-[#d9386a] text-white shadow-xs font-extrabold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70 dark:text-rose-200/70 dark:hover:bg-white/5 dark:hover:text-white'
              }`}
            >
              Kalender
            </button>
            <button
              type="button"
              onClick={() => {
                soundManager.playTap();
                setActiveTab('ringkasan');
              }}
              className={`rounded-xl px-2.5 py-1 sm:px-3 sm:py-1.5 transition-all ${
                activeTab === 'ringkasan'
                  ? 'bg-gradient-to-r from-[#FF5C77] to-[#d9386a] text-white shadow-xs font-extrabold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70 dark:text-rose-200/70 dark:hover:bg-white/5 dark:hover:text-white'
              }`}
            >
              <span className="hidden sm:inline">Ringkasan & Statistik</span>
              <span className="sm:hidden">Ringkasan</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundManager.playTap();
                setActiveTab('edukasi');
              }}
              className={`relative rounded-xl px-2.5 py-1 sm:px-3 sm:py-1.5 transition-all ${
                activeTab === 'edukasi'
                  ? 'bg-gradient-to-r from-[#FF5C77] to-[#d9386a] text-white shadow-xs font-extrabold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70 dark:text-rose-200/70 dark:hover:bg-white/5 dark:hover:text-white'
              }`}
            >
              <span className="hidden sm:inline">Edukasi & Medis</span>
              <span className="sm:hidden">Edukasi</span>
              {healthAlerts.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#FF5C77] ring-2 ring-white dark:ring-[#200508]" />
              )}
            </button>
          </div>

          {/* View Mode Toggle: Bulan | Tahun (Hanya saat di tab Kalender) */}
          {activeTab === 'kalender' && (
            <div className="inline-flex items-center rounded-xl bg-stone-100/80 p-0.5 text-[10.5px] font-sans-clean font-bold dark:bg-black/40">
              <button
                type="button"
                onClick={() => {
                  soundManager.playTap();
                  setViewMode('month');
                }}
                className={`rounded-lg px-2.5 py-1 transition-all ${
                  viewMode === 'month'
                    ? 'bg-white text-[#7A1018] shadow-xs dark:bg-[#7A1018] dark:text-[#EFE6DA]'
                    : 'text-stone-500 hover:text-stone-900 dark:text-rose-300/70 dark:hover:text-white'
                }`}
              >
                Bulan
              </button>
              <button
                type="button"
                onClick={() => {
                  soundManager.playTap();
                  setViewMode('year');
                }}
                className={`rounded-lg px-2.5 py-1 transition-all ${
                  viewMode === 'year'
                    ? 'bg-white text-[#7A1018] shadow-xs dark:bg-[#7A1018] dark:text-[#EFE6DA]'
                    : 'text-stone-500 hover:text-stone-900 dark:text-rose-300/70 dark:hover:text-white'
                }`}
              >
                Tahun
              </button>
            </div>
          )}
        </div>

        {/* Tab 1: Kalender (Bulan & Tahun) */}
        {activeTab === 'kalender' && (
          <div className="cycle-clay-card bg-white dark:bg-[#200508] rounded-2xl p-3 sm:p-4 shadow-md border border-[#7A1018]/15 relative">
            {/* Legend / Shape Guide - Sesuai Flo Asli */}
            <div className="flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-4 gap-y-1.5 text-[10px] sm:text-[11px] font-sans-clean font-medium pb-2.5 mb-2.5 border-b border-gray-100 dark:border-white/10">
              <div className="flex items-center space-x-1" title="Hari menstruasi (haid) tercatat">
                <span className="w-3.5 h-3.5 rounded-full bg-[#FF5C77] text-white flex items-center justify-center text-[8px] font-bold shadow-2xs">●</span>
                <span className="text-gray-700 dark:text-gray-300">Haid</span>
              </div>
              <div className="flex items-center space-x-1" title="Prediksi tanggal haid berikutnya">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-dotted border-[#FF5C77] text-[#FF5C77] flex items-center justify-center text-[8px] font-bold">○</span>
                <span className="text-gray-700 dark:text-gray-300">Prediksi Haid</span>
              </div>
              <div className="flex items-center space-x-1" title="Masa subur (fertile window)">
                <span className="text-[#21B3C4] font-bold text-xs">14</span>
                <span className="text-gray-700 dark:text-gray-300">Masa Subur</span>
              </div>
              <div className="flex items-center space-x-1" title="Prediksi hari ovulasi (puncak masa subur)">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-dotted border-[#21B3C4] text-[#21B3C4] flex items-center justify-center text-[8px] font-bold">○</span>
                <span className="text-gray-700 dark:text-gray-300">Ovulasi</span>
              </div>
              <div className="flex items-center space-x-1" title="Hari biasa di luar masa subur dan haid">
                <span className="w-3.5 h-3.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center justify-center text-[8px] font-bold">10</span>
                <span className="text-gray-700 dark:text-gray-300">Biasa</span>
              </div>
              <div className="flex items-center space-x-1" title="Keterlambatan menstruasi dari estimasi jadwal">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-dotted border-gray-400 text-gray-400 flex items-center justify-center text-[8px] font-bold">○</span>
                <span className="text-gray-700 dark:text-gray-300">Delay</span>
              </div>
              <div className="flex items-center space-x-1" title="Aktivitas seksual / keintiman tercatat">
                <Heart className="w-3.5 h-3.5 text-[#FF3B5C] fill-[#FF3B5C]" />
                <span className="text-gray-700 dark:text-gray-300">Catatan Intim</span>
              </div>
            </div>

            {/* Active Month View */}
            {viewMode === 'month' ? (
              <div>
                {/* Month Navigator: Prev Button, Month Name, Next Button, and "Bulan Ini" Button */}
                {(() => {
                  const activeYear = currentMonthDate.getFullYear();
                  const activeMonth = currentMonthDate.getMonth();
                  const daysCount = new Date(activeYear, activeMonth + 1, 0).getDate();
                  // Sesuai Flo Indonesia: Hari pertama adalah Minggu (M)
                  const firstDay = new Date(activeYear, activeMonth, 1).getDay(); // 0 = Minggu
                  const leadingBlanks = firstDay;
                  const days = Array.from({ length: daysCount }, (_, i) => i + 1);
                  const monthName = currentMonthDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

                  return (
                    <div>
                      {/* Month Navigation Bar */}
                      <div className="flex items-center justify-between mb-2 px-1">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <button
                            type="button"
                            onClick={goToPreviousMonth}
                            className="p-1 sm:p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 transition"
                            title="Bulan Sebelumnya"
                            aria-label="Bulan Sebelumnya"
                          >
                            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                          <h3 className="font-serif-title text-base sm:text-lg font-bold text-[#7A1018] dark:text-[#F4B6C2] min-w-[130px] sm:min-w-[160px] text-center">
                            {monthName}
                          </h3>
                          <button
                            type="button"
                            onClick={goToNextMonth}
                            className="p-1 sm:p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 transition"
                            title="Bulan Berikutnya"
                            aria-label="Bulan Berikutnya"
                          >
                            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        </div>

                        {!isViewingCurrentMonth && (
                          <button
                            type="button"
                            onClick={goToCurrentMonth}
                            className="text-[10px] sm:text-[11px] font-sans-clean font-bold px-2.5 py-1 rounded-full bg-[#7A1018]/10 text-[#7A1018] dark:bg-[#F4B6C2]/20 dark:text-[#F4B6C2] hover:bg-[#7A1018]/20 transition shadow-2xs"
                          >
                            Bulan Ini
                          </button>
                        )}
                      </div>

                      {/* Day of Week Header: M S S R K J S (Minggu - Sabtu sesuai Flo Indonesia) */}
                      <div className="grid grid-cols-7 gap-1 text-center font-sans-clean font-bold text-xs text-gray-400 mb-1.5">
                        <span>M</span>
                        <span>S</span>
                        <span>S</span>
                        <span>R</span>
                        <span>K</span>
                        <span>J</span>
                        <span>S</span>
                      </div>

                      {/* Days Grid */}
                      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                        {Array.from({ length: leadingBlanks }).map((_, bIdx) => (
                          <div key={`blank-${bIdx}`} className="h-12 sm:h-14" />
                        ))}

                        {days.map((dayNum) => {
                          const dateObj = new Date(activeYear, activeMonth, dayNum);
                          const dateStr = formatDateKey(dateObj);
                          const isToday = dateStr === todayStr;
                          const status = getDayStatus(dateObj, cycles, intimateLogs, stats);

                          return (
                            <button
                              key={dayNum}
                              type="button"
                              onClick={() => openDayActions(dateStr)}
                              className={`relative min-h-[52px] sm:min-h-[58px] rounded-xl flex flex-col items-center justify-between py-1 px-0.5 transition border ${
                                isToday
                                  ? 'border-gray-900/30 dark:border-white/30 bg-gray-50/80 dark:bg-white/5 font-bold shadow-xs'
                                  : 'border-transparent hover:border-gray-200 dark:hover:border-white/10'
                              }`}
                            >
                              {/* HARI INI text placed ABOVE the date number */}
                              <div className="h-2.5 flex items-center justify-center">
                                {isToday ? (
                                  <span className="text-[6.5px] sm:text-[7px] font-black tracking-tight text-gray-900 dark:text-white uppercase leading-none">
                                    HARI INI
                                  </span>
                                ) : null}
                              </div>

                              {/* Date Number with Flo Visual Codings */}
                              <div
                                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-transform ${
                                  status.isRecordedPeriod
                                    ? 'bg-[#FF5C77] text-white shadow-2xs' // 🔴 Haid tercatat: Lingkaran penuh merah/pink, teks putih
                                    : status.isPredictedPeriod
                                    ? 'border-2 border-dotted border-[#FF5C77] text-[#FF5C77] bg-transparent' // 🔴 Prediksi haid: Lingkaran putus-putus merah
                                    : status.isOvulation
                                    ? 'border-2 border-dotted border-[#21B3C4] text-[#21B3C4] bg-transparent' // ⭕ Prediksi ovulasi: Lingkaran putus-putus teal
                                    : status.isFertile
                                    ? 'text-[#21B3C4] font-extrabold' // 🔵 Masa subur: Teks angka teal tanpa lingkaran
                                    : status.isDelayed
                                    ? 'border-2 border-dotted border-gray-400 dark:border-gray-500 text-gray-400 bg-gray-50/50 dark:bg-white/5' // ⚪ Delay: Lingkaran abu-abu putus-putus
                                    : 'text-gray-800 dark:text-gray-200 font-medium' // ⚫ Hari biasa: Teks hitam / abu-abu biasa
                                }`}
                              >
                                {dayNum}
                              </div>

                              {/* Hubungan Intim Badge Under Date (Heart) */}
                              <div className="h-3 flex items-center justify-center space-x-0.5">
                                {status.intimateLogs.length > 0 && (
                                  <span className="relative inline-flex items-center text-[#FF3B5C]">
                                    <Heart className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-[#FF3B5C] text-[#FF3B5C]" />
                                    {status.intimateLogs.some(l => l.protection === 'tanpa_pengaman' || l.protectionIssue) && (
                                      <span className="text-[6px] text-white font-black absolute inset-0 flex items-center justify-center leading-none">
                                        !
                                      </span>
                                    )}
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              /* Year View: 12 Mini Month Grids */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 py-2">
                {Array.from({ length: 12 }).map((_, mIdx) => {
                  const currentYear = currentMonthDate.getFullYear();
                  const mDate = new Date(currentYear, mIdx, 1);
                  const mName = mDate.toLocaleDateString('id-ID', { month: 'short' });
                  const daysInM = new Date(currentYear, mIdx + 1, 0).getDate();
                  const isThisMonth = currentYear === new Date().getFullYear() && mIdx === new Date().getMonth();

                  return (
                    <button
                      key={mIdx}
                      type="button"
                      onClick={() => {
                        soundManager.playTap();
                        setCurrentMonthDate(new Date(currentYear, mIdx, 1));
                        setViewMode('month');
                      }}
                      className={`p-2.5 rounded-xl text-left transition border ${
                        isThisMonth
                          ? 'bg-rose-50/50 dark:bg-rose-950/20 border-[#7A1018]/30 shadow-2xs'
                          : 'bg-gray-50 dark:bg-black/30 border-gray-100 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-xs font-bold text-[#7A1018] dark:text-[#F4B6C2] font-serif-title">
                          {mName}
                        </h4>
                        {isThisMonth && (
                          <span className="text-[7px] font-bold uppercase tracking-wider text-[#7A1018] dark:text-[#F4B6C2]">
                            Bulan ini
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-7 gap-0.5 text-[8px]">
                        {Array.from({ length: daysInM }).map((_, dIdx) => {
                          const dateObj = new Date(currentYear, mIdx, dIdx + 1);
                          const status = getDayStatus(dateObj, cycles, intimateLogs, stats);

                          let dotColor = 'bg-gray-200 dark:bg-gray-700';
                          if (status.isRecordedPeriod) dotColor = 'bg-[#FF5C77]';
                          else if (status.isPredictedPeriod) dotColor = 'bg-[#FF5C77]/40 ring-1 ring-[#FF5C77]';
                          else if (status.isOvulation) dotColor = 'bg-[#21B3C4] ring-1 ring-[#21B3C4]';
                          else if (status.isFertile) dotColor = 'bg-[#21B3C4]/50';
                          else if (status.isDelayed) dotColor = 'bg-gray-400';

                          return (
                            <div
                              key={dIdx}
                              className={`w-2 h-2 rounded-full mx-auto ${dotColor}`}
                              title={`${dIdx + 1} ${mName}`}
                            />
                          );
                        })}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Sticky Action Buttons at Bottom - Flo Style */}
            {canEdit && (
              <div className="sticky bottom-2 mt-4 flex items-center justify-center gap-2.5 bg-white/95 dark:bg-[#200508]/95 p-2 sm:p-2.5 rounded-2xl border border-[#7A1018]/15 shadow-xl backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => { setSelectedDate(todayStr); openPeriodEditorForDate(todayStr); }}
                  className="px-5 py-2.5 rounded-full bg-[#FF5C77] hover:bg-[#eb4b66] text-white font-bold text-xs sm:text-sm font-sans-clean transition shadow-md flex items-center space-x-1.5"
                >
                  <CalendarIcon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Edit tanggal periode haid</span>
                </button>

                <button
                  type="button"
                  onClick={() => openLogModalForDate(todayStr)}
                  className="px-4 py-2.5 rounded-full bg-[#7A1018] hover:bg-[#5e0a11] text-[#EFE6DA] font-bold text-xs font-sans-clean transition shadow-sm flex items-center space-x-1.5"
                >
                  <Heart className="w-3.5 h-3.5 fill-current flex-shrink-0 text-[#FF3B5C]" />
                  <span>Catat Hubungan</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Ringkasan & Statistik Privat */}
        {activeTab === 'ringkasan' && (
          <div className="cycle-clay-card bg-white dark:bg-[#200508] rounded-2xl p-3 sm:p-4 shadow-md border border-[#7A1018]/15 space-y-4">
            <div>
              <h3 className="font-serif-title text-base sm:text-lg font-bold text-[#7A1018] dark:text-[#F4B6C2]">
                Ringkasan Siklus & Log Intim
              </h3>
              <p className="text-[11px] text-gray-500 font-sans-clean mt-0.5">
                Data privat per siklus dan per bulan untuk pemahaman kesehatan bersama tanpa peringkat.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
              <div className="p-2.5 sm:p-3 rounded-xl bg-[#EFE6DA]/40 dark:bg-black/30 border border-[#7A1018]/10 text-center">
                <span className="text-[9px] uppercase font-bold text-gray-500 block font-sans-clean">
                  Rata-rata Siklus
                </span>
                <span className="text-lg sm:text-xl font-bold text-[#7A1018] dark:text-[#F4B6C2] font-serif-title">
                  {stats.averageCycleLength} Hari
                </span>
              </div>
              <div className="p-2.5 sm:p-3 rounded-xl bg-[#EFE6DA]/40 dark:bg-black/30 border border-[#7A1018]/10 text-center">
                <span className="text-[9px] uppercase font-bold text-gray-500 block font-sans-clean">
                  Durasi Haid
                </span>
                <span className="text-lg sm:text-xl font-bold text-[#7A1018] dark:text-[#F4B6C2] font-serif-title">
                  {stats.averagePeriodLength} Hari
                </span>
              </div>
              <div className="p-2.5 sm:p-3 rounded-xl bg-[#EFE6DA]/40 dark:bg-black/30 border border-[#7A1018]/10 text-center">
                <span className="text-[9px] uppercase font-bold text-gray-500 block font-sans-clean">
                  Tingkat Pengaman
                </span>
                <span className="text-lg sm:text-xl font-bold text-teal-600 dark:text-teal-400 font-serif-title">
                  {intimateStats.protectedRate}%
                </span>
              </div>
              <div className="p-2.5 sm:p-3 rounded-xl bg-[#EFE6DA]/40 dark:bg-black/30 border border-[#7A1018]/10 text-center">
                <span className="text-[9px] uppercase font-bold text-gray-500 block font-sans-clean">
                  Total Log Intim
                </span>
                <span className="text-lg sm:text-xl font-bold text-[#3B0A0F] dark:text-[#EFE6DA] font-serif-title">
                  {intimateStats.total} Kali
                </span>
              </div>
            </div>

            {/* List of Intimate Logs with Delete & Details */}
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/10">
              <h4 className="font-serif-title font-bold text-sm text-[#3B0A0F] dark:text-[#EFE6DA] mb-2">
                Riwayat Catatan Intim
              </h4>

              {intimateLogs.length === 0 ? (
                <p className="text-[11px] text-gray-400 font-sans-clean italic">Belum ada catatan hubungan intim.</p>
              ) : (
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {intimateLogs.map((log) => {
                    const linkedPin = pins.find((p) => p.id === log.pinId);
                    return (
                      <div
                        key={log.id}
                        className="p-2 sm:p-2.5 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/5 flex items-center justify-between text-xs font-sans-clean"
                      >
                        <div className="flex items-center space-x-2.5">
                          <MoodBadge moodKey={log.mood || 'romantis'} />
                          <div>
                            <div className="font-bold text-[#3B0A0F] dark:text-[#EFE6DA] text-xs">
                              {log.date} {log.time ? `• ${log.time}` : ''}
                            </div>
                            <div className="text-[10px] text-gray-500 flex items-center flex-wrap gap-1 mt-0.5">
                              <span>Metode: <strong>{log.protection}</strong></span>
                              {log.protectionIssue && (
                                <span className="inline-flex items-center text-red-600 font-bold bg-red-100 dark:bg-red-950/40 px-1.5 py-0.5 rounded text-[9px]">
                                  <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />
                                  Ada kendala/bocor
                                </span>
                              )}
                              {log.notes ? <span>— "{log.notes}"</span> : null}
                              {linkedPin ? <span>• Lokasi: {linkedPin.title}</span> : null}
                            </div>
                          </div>
                        </div>

                        {canEdit && <button
                          type="button"
                          onClick={() => {
                            if (confirm('Hapus log intim tanggal ' + log.date + '?')) {
                              onDeleteIntimateLog(log.id);
                            }
                          }}
                          className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded"
                        >
                          Hapus
                        </button>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Privacy Wipe Button */}
            {canEdit && <div className="pt-3 border-t border-gray-100 dark:border-white/10 flex items-center justify-between">
              <span className="text-[11px] text-gray-500">
                Penyimpanan lokal di perangkat ini terenkripsi.
              </span>
              <button
                type="button"
                onClick={() => {
                  if (confirm('PERINGATAN: Hapus permanen seluruh riwayat siklus & log intim?')) {
                    onWipeData();
                  }
                }}
                className="text-[11px] text-red-600 hover:underline font-bold"
              >
                Hapus Semua Data Siklus & Intim
              </button>
            </div>}
          </div>
        )}

        {/* Tab 3: Kartu Informasi Medis & Kesehatan Netral */}
        {activeTab === 'edukasi' && (
          <div className="cycle-clay-card bg-white dark:bg-[#200508] rounded-2xl p-3 sm:p-4 shadow-md border border-[#7A1018]/15 space-y-3.5 font-sans-clean text-xs">
            <div className="flex items-center space-x-2 text-[#7A1018] dark:text-[#F4B6C2]">
              <Info className="w-4 h-4 flex-shrink-0" />
              <h3 className="font-serif-title text-base sm:text-lg font-bold">
                Informasi Kesehatan & Panduan Netral
              </h3>
            </div>

            {/* If there are health risk alerts */}
            {healthAlerts.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 space-y-1.5">
                <div className="flex items-center space-x-1.5 font-bold text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Catatan Perhatian Khusus:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  {healthAlerts.map((alert, idx) => (
                    <li key={idx}>
                      Tanggal {alert.log.date}: {alert.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-white/5 space-y-1.5">
                <h4 className="font-bold text-[#7A1018] dark:text-[#F4B6C2] text-xs flex items-center space-x-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Kontrasepsi Darurat (Morning-After Pill)</span>
                </h4>
                <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed">
                  Bila terjadi hubungan intim tanpa pengaman atau kondom robek di masa subur, kontrasepsi darurat (seperti Levonorgestrel) paling efektif diminum <strong>sedini mungkin</strong> (terbaik dalam 24 jam, maksimal 72-120 jam tergantung jenis). Konsultasikan dengan apoteker atau dokter terdekat.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-white/5 space-y-1.5">
                <h4 className="font-bold text-[#7A1018] dark:text-[#F4B6C2] text-xs flex items-center space-x-1.5">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>Waktu Tes Kehamilan yang Akurat</span>
                </h4>
                <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed">
                  Tes kehamilan menggunakan testpack urine paling akurat dilakukan mulai dari <strong>hari pertama setelah terlambat haid</strong>, menggunakan urine pertama di pagi hari karena konsentrasi hormon hCG berada pada titik tertinggi.
                </p>
              </div>
            </div>

            {/* Health Center Nearby Semarang Links */}
            <div className="p-3 rounded-xl bg-[#EFE6DA]/40 dark:bg-black/30 border border-[#7A1018]/10 flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <div>
                <h5 className="font-bold text-[#3B0A0F] dark:text-[#EFE6DA] text-xs">
                  Layanan Kesehatan & Rumah Sakit Terdekat di Semarang
                </h5>
                <p className="text-gray-500 text-[10px]">
                  RSND Undip Tembalang, RS Kariadi Semarang, atau Apotek K-24 / Kimia Farma terdekat.
                </p>
              </div>
              <a
                href="https://www.google.com/maps/search/Apotek+dan+Rumah+Sakit+terdekat+Semarang"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-[#7A1018] text-[#EFE6DA] rounded-lg font-bold text-[11px] whitespace-nowrap hover:bg-[#5e0a11] transition"
              >
                Cari Layanan Kesehatan &rarr;
              </a>
            </div>

            {/* Permanent Medical Disclaimer as required */}
            <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-black/40 text-[9px] text-gray-500 leading-relaxed">
              <strong>DISCLAIMER MEDIS:</strong> Kalender ini dan perkiraan masa subur/ovulasi adalah perkiraan matematis berbasis kalender dan BUKAN alat kontrasepsi yang pasti atau pengganti diagnosis medis klinis. Siklus dapat dipengaruhi stres, kelelahan, dan hormon. Selalu gunakan perlindungan ganda untuk kesehatan bersama.
            </div>
          </div>
        )}

      <AnimatePresence>
        {isDayActionModalOpen && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) setIsDayActionModalOpen(false); }}>
            <motion.div role="dialog" aria-modal="true" aria-labelledby="cycle-day-actions-title" className="w-full max-w-sm rounded-3xl border border-[#e8bdc3] bg-[#fffaf5] p-5 shadow-2xl dark:border-white/10 dark:bg-[#250709]" initial={{ opacity: 0, scale: .92, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .94, y: 10 }} transition={{ type: 'spring', damping: 25, stiffness: 350 }}>
              <div className="mb-4 flex items-start justify-between gap-3"><div><h2 id="cycle-day-actions-title" className="font-sans-clean text-base font-extrabold text-[#7A1018] dark:text-[#F4B6C2]">Catat tanggal</h2><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(parseDate(selectedDate))}</p></div><CloseButton onClick={() => { soundManager.playTap(); setIsDayActionModalOpen(false); }} /></div>
              <div className="space-y-2">
                <button type="button" onClick={() => openPeriodEditorForDate(selectedDate)} className="flex w-full items-center gap-3 rounded-2xl border border-rose-200 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:bg-rose-50 active:scale-[.98] dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f9dce1] text-[#a94761]"><CalendarIcon className="h-5 w-5" /></span><span><strong className="block text-xs text-[#57202c] dark:text-rose-50">Haid & masa subur</strong><span className="text-[10px] text-gray-500 dark:text-gray-400">Catat atau ubah tanggal</span></span></button>
                <button type="button" onClick={() => openLogModalForDate(selectedDate)} className="flex w-full items-center gap-3 rounded-2xl border border-rose-200 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:bg-rose-50 active:scale-[.98] dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f9dce1] text-[#a94761]"><Heart className="h-5 w-5" /></span><span><strong className="block text-xs text-[#57202c] dark:text-rose-50">Catatan intim</strong><span className="text-[10px] text-gray-500 dark:text-gray-400">Tambah catatan untuk tanggal ini</span></span></button>
              </div>
              <button type="button" onClick={() => { soundManager.playTap(); setIsDayActionModalOpen(false); }} className="mt-4 min-h-10 w-full rounded-xl bg-gray-100 text-xs font-bold text-gray-600 transition hover:bg-gray-200 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/15">Batal</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  <CloseButton onClick={() => { soundManager.playTap(); setIsLogModalOpen(false); }} />
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
                    onClick={() => { soundManager.playTap(); setIsLogModalOpen(false); }}
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
                    {editingCycleId ? 'Ubah Catatan Siklus' : 'Catat Haid & Masa Subur'}
                  </h3>
                </div>
                <CloseButton onClick={() => { soundManager.playTap(); setIsPeriodEditModalOpen(false); setEditingCycleId(null); }} />
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
                    onChange={(e) => {
                      const startDate = e.target.value;
                      const start = parseDate(startDate);
                      const ovulationDate = formatDateKey(new Date(start.getTime() + (stats.averageCycleLength - 14) * 86400000));
                      setPeriodForm({ ...periodForm, startDate, ovulationDate, fertileStartDate: formatDateKey(new Date(parseDate(ovulationDate).getTime() - 5 * 86400000)), fertileEndDate: ovulationDate });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/30 border border-[#7A1018]/20"
                  />
                </div>

                <div className="rounded-2xl border border-teal-200/80 bg-teal-50/70 p-3 dark:border-teal-900/50 dark:bg-teal-950/20">
                  <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wide text-teal-800 dark:text-teal-200">Masa subur · perkiraan yang bisa diubah</p>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-[10px] font-bold text-gray-600 dark:text-gray-300">Mulai<input type="date" value={periodForm.fertileStartDate} onChange={(e) => setPeriodForm({ ...periodForm, fertileStartDate: e.target.value })} className="mt-1 w-full rounded-xl border border-teal-200 bg-white px-2 py-2 text-xs dark:border-white/10 dark:bg-black/30" /></label>
                    <label className="text-[10px] font-bold text-gray-600 dark:text-gray-300">Akhir<input type="date" value={periodForm.fertileEndDate} onChange={(e) => setPeriodForm({ ...periodForm, fertileEndDate: e.target.value })} className="mt-1 w-full rounded-xl border border-teal-200 bg-white px-2 py-2 text-xs dark:border-white/10 dark:bg-black/30" /></label>
                    <label className="col-span-2 text-[10px] font-bold text-gray-600 dark:text-gray-300">Perkiraan ovulasi<input type="date" value={periodForm.ovulationDate} onChange={(e) => setPeriodForm({ ...periodForm, ovulationDate: e.target.value })} className="mt-1 w-full rounded-xl border border-teal-200 bg-white px-2 py-2 text-xs dark:border-white/10 dark:bg-black/30" /></label>
                  </div>
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
                    onClick={() => { soundManager.playTap(); setIsPeriodEditModalOpen(false); setEditingCycleId(null); }}
                    className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#7A1018] hover:bg-[#5e0a11] text-[#EFE6DA] rounded-xl font-bold"
                  >
                    Simpan Siklus
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
