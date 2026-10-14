import { CycleRecord, IntimateLog } from '../types';

export interface CycleStats {
  averageCycleLength: number;
  averagePeriodLength: number;
  totalCyclesTracked: number;
  lastPeriodStart: string | null;
  nextPredictedPeriod: string | null;
  nextPredictedOvulation: string | null;
  daysUntilNextPeriod: number | null;
}

export interface DayStatus {
  dateStr: string; // YYYY-MM-DD
  isRecordedPeriod: boolean;
  isPredictedPeriod: boolean;
  isFertile: boolean;
  isOvulation: boolean;
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
      averageCycleLength: 28,
      averagePeriodLength: 5,
      totalCyclesTracked: 0,
      lastPeriodStart: null,
      nextPredictedPeriod: null,
      nextPredictedOvulation: null,
      daysUntilNextPeriod: null
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
    if (diff > 15 && diff < 60) {
      totalCycleDays += diff;
      cycleIntervalCount++;
    }
  }

  const avgCycle = cycleIntervalCount > 0 ? Math.round(totalCycleDays / cycleIntervalCount) : 28;
  const lastCycle = sorted[sorted.length - 1];
  const lastStart = parseDate(lastCycle.startDate);
  const nextPeriod = addDays(lastStart, avgCycle);
  const nextOvulation = addDays(nextPeriod, -14);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysUntilNext = getDaysDiff(today, nextPeriod);

  return {
    averageCycleLength: avgCycle,
    averagePeriodLength: avgPeriod,
    totalCyclesTracked: cycles.length,
    lastPeriodStart: lastCycle.startDate,
    nextPredictedPeriod: formatDateKey(nextPeriod),
    nextPredictedOvulation: formatDateKey(nextOvulation),
    daysUntilNextPeriod: daysUntilNext
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

  let isRecordedPeriod = false;
  let isPredictedPeriod = false;
  let isFertile = false;
  let isOvulation = false;

  // Check recorded periods
  for (const c of cycles) {
    const start = parseDate(c.startDate);
    const periodDays = c.periodLength || stats.averagePeriodLength || 5;
    const diff = getDaysDiff(start, dateObj);
    if (diff >= 0 && diff < periodDays) {
      isRecordedPeriod = true;
      break;
    }
  }

  // Check predicted periods and fertile windows for the future or unrecorded cycles
  if (stats.lastPeriodStart) {
    const lastStart = parseDate(stats.lastPeriodStart);
    const avgCycle = stats.averageCycleLength;
    const avgPeriod = stats.averagePeriodLength;

    // Project up to 6 cycles ahead
    for (let i = 1; i <= 6; i++) {
      const predStart = addDays(lastStart, avgCycle * i);
      const diffPeriod = getDaysDiff(predStart, dateObj);
      if (diffPeriod >= 0 && diffPeriod < avgPeriod) {
        if (!isRecordedPeriod) isPredictedPeriod = true;
      }

      // Ovulation is approximately 14 days before next period start
      const predOvulation = addDays(predStart, -14);
      if (formatDateKey(predOvulation) === dateStr) {
        isOvulation = true;
      }

      // Fertile window: 5 days prior to ovulation through ovulation day
      const diffOvu = getDaysDiff(predOvulation, dateObj);
      if (diffOvu >= -5 && diffOvu <= 0) {
        isFertile = true;
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
