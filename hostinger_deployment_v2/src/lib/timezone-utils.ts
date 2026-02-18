// Timezone configuration and conversion utilities
// All meetings are stored in UK time internally

export type TimezoneKey = 'UK' | 'MM' | 'TH';

export interface TimezoneConfig {
  key: TimezoneKey;
  label: string;
  shortLabel: string;
  offsetMinutes: number; // offset from UTC in minutes
  color: string;        // text color for display
  bgColor: string;      // background tint for display
}

export const TIMEZONES: Record<TimezoneKey, TimezoneConfig> = {
  UK: {
    key: 'UK',
    label: 'UK (GMT)',
    shortLabel: 'UK',
    offsetMinutes: 0,
    color: '#0369A1',
    bgColor: '#F0F9FF',
  },
  MM: {
    key: 'MM',
    label: 'Myanmar (MMT)',
    shortLabel: 'MM',
    offsetMinutes: 390, // UTC+6:30
    color: '#B45309',
    bgColor: '#FFFBEB',
  },
  TH: {
    key: 'TH',
    label: 'Thailand (ICT)',
    shortLabel: 'TH',
    offsetMinutes: 420, // UTC+7
    color: '#047857',
    bgColor: '#ECFDF5',
  },
};

export const TIMEZONE_KEYS: TimezoneKey[] = ['UK', 'MM', 'TH'];

export interface ConvertedTime {
  time: string;     // HH:MM format
  dateDelta: number; // -1, 0, or +1 day shift
}

/**
 * Convert a time from one timezone to another.
 * Returns the converted time and a dateDelta indicating day boundary crossing.
 */
export function convertTime(time: string, fromTZ: TimezoneKey, toTZ: TimezoneKey): ConvertedTime {
  if (!time || fromTZ === toTZ) return { time, dateDelta: 0 };

  const [hours, minutes] = time.split(':').map(Number);
  const fromOffset = TIMEZONES[fromTZ].offsetMinutes;
  const toOffset = TIMEZONES[toTZ].offsetMinutes;

  // Convert to total minutes from midnight, then shift by offset difference
  const totalMinutes = hours * 60 + minutes + (toOffset - fromOffset);

  let dateDelta = 0;
  let adjustedMinutes = totalMinutes;

  if (adjustedMinutes >= 1440) {
    adjustedMinutes -= 1440;
    dateDelta = 1;
  } else if (adjustedMinutes < 0) {
    adjustedMinutes += 1440;
    dateDelta = -1;
  }

  const newHours = Math.floor(adjustedMinutes / 60);
  const newMins = adjustedMinutes % 60;

  return {
    time: `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`,
    dateDelta,
  };
}

/**
 * Convert a time from any timezone to UK for storage.
 */
export function convertToUK(time: string, fromTZ: TimezoneKey): ConvertedTime {
  return convertTime(time, fromTZ, 'UK');
}

/**
 * Shift a date string (YYYY-MM-DD) by delta days (+1 or -1).
 */
export function adjustDate(dateStr: string, delta: number): string {
  if (delta === 0) return dateStr;
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + delta);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export interface DisplayTime {
  timezone: TimezoneKey;
  config: TimezoneConfig;
  time: string;       // HH:MM
  formatted: string;  // 12-hour AM/PM
  dateDelta: number;
  dateLabel: string;   // e.g. "(+1 day)" or ""
}

/**
 * Get display times for a meeting stored in UK time.
 * Returns an array of display times for each requested timezone.
 */
export function getDisplayTimes(ukTime: string, timezones: TimezoneKey[]): DisplayTime[] {
  return timezones.map(tz => {
    const { time, dateDelta } = convertTime(ukTime, 'UK', tz);
    const config = TIMEZONES[tz];
    return {
      timezone: tz,
      config,
      time,
      formatted: formatTime12h(time),
      dateDelta,
      dateLabel: dateDelta === 1 ? '(+1 day)' : dateDelta === -1 ? '(-1 day)' : '',
    };
  });
}

/**
 * Format HH:MM to 12-hour AM/PM string.
 */
export function formatTime12h(time: string): string {
  if (!time) return '';
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
}
