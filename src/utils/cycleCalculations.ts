import { CycleRecord, IntimateLog } from '../types';

export interface CycleStats {
  averageCycleLength: number;
  averagePeriodLength: number;
  totalCyclesTracked: number;
  lastPeriodStart: string | null;
  nextPredictedPeriod: string | null;
  nextPredictedOvulation: string | null;
  daysUntilNextPeriod: number | null;
  isPeriodDelayed?: boolean;
  daysDelayed?: number;
}

export interface DayStatus {
  dateStr: string; // YYYY-MM-DD
  isRecordedPeriod: boolean; // 🔴 Solid red/coral-pink
  isPredictedPeriod: boolean; // 🔴 Dotted red/coral-pink
  isFertile: boolean; // 🔵 Teal text
  isOvulation: boolean; // ⭕ Dotted teal circle around teal text
  isDelayed?: boolean; // ⚪ Dotted gray circle or Delay
  delayDaysCount?: number;
  intimateLogs: IntimateLog[];
  cycleDayNumber?: number;
}

// Helper to format date YYYY-MM-DD
export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function getDaysDiff(d1: Date, d2: Date): number {
  const diffTime = d2.getTime() - d1.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export function calculateCycleStats(cycles: CycleRecord[]): CycleStats {
  if (cycles.length === 0) {
    return {
      averageCycleLength: 26,
      averagePeriodLength: 5,
      totalCyclesTracked: 0,
      lastPeriodStart: null,
      nextPredictedPeriod: null,
      nextPredictedOvulation: null,
      daysUntilNextPeriod: null,
      isPeriodDelayed: false,
      daysDelayed: 0
    };
  }

  const sorted = [...cycles].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const totalPeriodDays = sorted.reduce((acc, c) => acc + (c.periodLength || 5), 0);
  const avgPeriod = Math.round(totalPeriodDays / sorted.length) || 5;

  let totalCycleDays = 0;
  let cycleIntervalCount = 0;
  for (let i = 1; i < sorted.length; i++) {
    const prev = parseDate(sorted[i - 1].startDate);
    const curr = parseDate(sorted[i].startDate);
    const diff = getDaysDiff(prev, curr);
    if (diff >= 18 && diff <= 50) {
      totalCycleDays += diff;
      cycleIntervalCount++;
    }
  }

  const avgCycle = cycleIntervalCount > 0 ? Math.round(totalCycleDays / cycleIntervalCount) : (sorted[sorted.length - 1].cycleLength || 26);
  const lastCycle = sorted[sorted.length - 1];
  const lastStart = parseDate(lastCycle.startDate);
  const nextPeriod = addDays(lastStart, avgCycle);
  // In Flo algorithm: ovulation is 15 days before next expected period (e.g. 26 - 15 = day 11/12)
  const nextOvulation = addDays(nextPeriod, -15);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysUntilNext = getDaysDiff(today, nextPeriod);
  const isDelayed = today > nextPeriod && !sorted.some(c => c.startDate >= formatDateKey(nextPeriod));
  const daysDelayed = isDelayed ? getDaysDiff(nextPeriod, today) : 0;

  return {
    averageCycleLength: avgCycle,
    averagePeriodLength: avgPeriod,
    totalCyclesTracked: cycles.length,
    lastPeriodStart: lastCycle.startDate,
    nextPredictedPeriod: formatDateKey(nextPeriod),
    nextPredictedOvulation: formatDateKey(nextOvulation),
    daysUntilNextPeriod: daysUntilNext,
    isPeriodDelayed: isDelayed,
    daysDelayed
  };
}

export function getDayStatus(
  date: Date,
  cycles: CycleRecord[],
  intimateLogs: IntimateLog[],
  stats: CycleStats
): DayStatus {
  const dateStr = formatDateKey(date);
  const dateObj = new Date(date);
  dateObj.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let isRecordedPeriod = false;
  let isPredictedPeriod = false;
  let isFertile = false;
  let isOvulation = false;
  let isDelayed = false;
  let delayDaysCount = 0;

  // 1. Check recorded cycles
  for (const c of cycles) {
    const start = parseDate(c.startDate);
    const periodDays = c.periodLength || stats.averagePeriodLength || 5;
    const periodEnd = c.endDate ? parseDate(c.endDate) : addDays(start, periodDays - 1);

    if (c.recordedPeriodEndDate) {
      const confirmedEnd = parseDate(c.recordedPeriodEndDate);
      if (dateObj >= start && dateObj <= confirmedEnd) {
        isRecordedPeriod = true;
      } else if (dateObj > confirmedEnd && dateObj <= periodEnd) {
        isPredictedPeriod = true;
      }
    } else {
      if (dateObj >= start && dateObj <= periodEnd) {
        if (dateObj <= today) {
          isRecordedPeriod = true;
        } else {
          isPredictedPeriod = true;
        }
      }
    }

    // Fertile window & Ovulation for recorded cycle
    if (c.ovulationDate && c.fertileStartDate && c.fertileEndDate) {
      if (dateStr === c.ovulationDate) {
        isOvulation = true;
        isFertile = true;
      } else if (dateObj >= parseDate(c.fertileStartDate) && dateObj <= parseDate(c.fertileEndDate)) {
        isFertile = true;
      }
    } else {
      const cLen = c.cycleLength || stats.averageCycleLength || 26;
      const cNextPeriod = addDays(start, cLen);
      const cOvulation = addDays(cNextPeriod, -15);
      const cFertileStart = addDays(cOvulation, -4);
      const cFertileEnd = addDays(cOvulation, 2);

      if (formatDateKey(cOvulation) === dateStr) {
        isOvulation = true;
        isFertile = true;
      } else if (dateObj >= cFertileStart && dateObj <= cFertileEnd) {
        isFertile = true;
      }
    }
  }

  // 2. Check predicted future cycles (projecting forward)
  if (stats.lastPeriodStart) {
    const lastStart = parseDate(stats.lastPeriodStart);
    const avgCycle = stats.averageCycleLength || 26;
    const avgPeriod = stats.averagePeriodLength || 5;

    for (let i = 1; i <= 12; i++) {
      const predPeriodStart = addDays(lastStart, avgCycle * i);
      const predPeriodEnd = addDays(predPeriodStart, avgPeriod - 1);
      const nextCycleStart = addDays(lastStart, avgCycle * (i + 1));
      const predOvulation = addDays(nextCycleStart, -15);
      const fertileStart = addDays(predOvulation, -4);
      const fertileEnd = addDays(predOvulation, 2);

      if (dateObj >= predPeriodStart && dateObj <= predPeriodEnd) {
        if (!isRecordedPeriod) isPredictedPeriod = true;
      }

      if (formatDateKey(predOvulation) === dateStr) {
        isOvulation = true;
        isFertile = true;
      } else if (dateObj >= fertileStart && dateObj <= fertileEnd) {
        isFertile = true;
      }
    }

    // 3. Check for Delay (Keterlambatan Haid)
    if (stats.nextPredictedPeriod) {
      const nextPeriodDate = parseDate(stats.nextPredictedPeriod);
      if (today > nextPeriodDate) {
        const hasLoggedNewCycle = cycles.some(c => c.startDate >= stats.nextPredictedPeriod!);
        if (!hasLoggedNewCycle && dateObj >= nextPeriodDate && dateObj <= today) {
          if (!isRecordedPeriod && !isPredictedPeriod) {
            isDelayed = true;
            delayDaysCount = getDaysDiff(nextPeriodDate, dateObj) + 1;
          }
        }
      }
    }
  }

  const logsForDay = intimateLogs.filter((log) => log.date === dateStr);

  return {
    dateStr,
    isRecordedPeriod,
    isPredictedPeriod,
    isFertile,
    isOvulation,
    isDelayed,
    delayDaysCount,
    intimateLogs: logsForDay
  };
}

export interface IntimateHealthAlert {
  log: IntimateLog;
  reason: 'fertile_window_unprotected' | 'condom_issue_fertile' | 'unprotected_general';
  message: string;
}

export function checkIntimateHealthRisk(
  logs: IntimateLog[],
  cycles: CycleRecord[],
  stats: CycleStats
): IntimateHealthAlert[] {
  const alerts: IntimateHealthAlert[] = [];

  logs.forEach((log) => {
    const logDate = parseDate(log.date);
    const status = getDayStatus(logDate, cycles, logs, stats);

    const isUnprotected = log.protection === 'tanpa_pengaman';
    const isCondomBroke = log.protection === 'kondom' && log.protectionIssue;

    if (status.isFertile || status.isOvulation) {
      if (isUnprotected) {
        alerts.push({
          log,
          reason: 'fertile_window_unprotected',
          message: 'Hubungan intim tercatat tanpa pengaman di dalam perkiraan masa subur.'
        });
      } else if (isCondomBroke) {
        alerts.push({
          log,
          reason: 'condom_issue_fertile',
          message: 'Tercatat kendala pengaman (kondom robek/lepas/bocor) di masa subur.'
        });
      }
    } else if (isUnprotected) {
      alerts.push({
        log,
        reason: 'unprotected_general',
        message: 'Hubungan intim tercatat tanpa pengaman.'
      });
    }
  });

  return alerts;
}

export function getIntimateStats(logs: IntimateLog[]) {
  const total = logs.length;
  if (total === 0) return { total: 0, protectedRate: 100, condomCount: 0, unprotectedCount: 0, issuesCount: 0 };

  const condomCount = logs.filter((l) => l.protection === 'kondom').length;
  const otherCount = logs.filter((l) => l.protection === 'metode_lain').length;
  const unprotectedCount = logs.filter((l) => l.protection === 'tanpa_pengaman').length;
  const issuesCount = logs.filter((l) => l.protectionIssue).length;

  const protectedLogs = condomCount + otherCount;
  const protectedRate = Math.round((protectedLogs / total) * 100);

  return {
    total,
    protectedRate,
    condomCount,
    unprotectedCount,
    issuesCount
  };
}
