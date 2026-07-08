import { BadRequestException } from '@nestjs/common';

export function parseTimeString(timeStr: string): {
  hour: number;
  minute: number;
} {
  const [hour, minute] = timeStr.split(':').map(Number);
  return { hour, minute };
}

export function isTimeOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date,
): boolean {
  return start1 < end2 && end1 > start2;
}

export function validateDateRangeLimit(
  start: Date,
  end: Date,
  maxDays: number,
): void {
  if (start >= end) {
    throw new BadRequestException('startDate must be before endDate');
  }
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays > maxDays) {
    throw new BadRequestException(
      `The date range cannot exceed ${maxDays} days`,
    );
  }
}

export const addDaysToDate = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const addDaysToDateString = (
  dateString: string,
  days: number,
): string => {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const parseMonthYearToDateRange = (
  monthYear: string,
): { startDate: Date; endDate: Date } => {
  const [year, month] = monthYear.split('-').map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  return { startDate, endDate };
};

export const formatDateRange = (
  startDate: Date,
  endDate: Date,
  locale: string = 'es-MX',
): string => {
  return `${startDate.toLocaleDateString(locale)} - ${endDate.toLocaleDateString(locale)}`;
};

export function formatFullDate(
  date: string | Date,
  locale: string = 'es-MX',
): string {
  return new Date(date).toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
