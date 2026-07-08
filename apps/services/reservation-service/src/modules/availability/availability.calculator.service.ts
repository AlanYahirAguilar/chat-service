import { Injectable } from '@nestjs/common';
import { parseTimeString, isTimeOverlap } from '@syncslot/shared';

export interface TimeSlot {
  startTime: string;
  endTime: string;
}

export interface ScheduleLike {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface ReservationLike {
  startTime: Date | string;
  endTime: Date | string;
}

@Injectable()
export class AvailabilityCalculatorService {
  calculate(
    schedules: ScheduleLike[],
    reservations: ReservationLike[],
    start: Date,
    end: Date,
  ): TimeSlot[] {
    const availableSlots: TimeSlot[] = [];
    const currentDate = new Date(start);
    currentDate.setUTCHours(0, 0, 0, 0);

    while (currentDate < end) {
      const dayOfWeekIndex = currentDate.getUTCDay(); // 0-6
      const dailySchedules = schedules.filter(
        (s) => s.dayOfWeek === dayOfWeekIndex,
      );

      for (const schedule of dailySchedules) {
        const { hour: startHour, minute: startMin } = parseTimeString(
          schedule.startTime,
        );
        const { hour: endHour, minute: endMin } = parseTimeString(
          schedule.endTime,
        );

        const slotStart = new Date(currentDate);
        slotStart.setUTCHours(startHour, startMin, 0, 0);

        const scheduleEnd = new Date(currentDate);
        scheduleEnd.setUTCHours(endHour, endMin, 0, 0);

        while (slotStart < scheduleEnd) {
          const slotEnd = new Date(slotStart);
          slotEnd.setUTCMinutes(slotStart.getUTCMinutes() + 30); // 30 mins slots

          if (slotEnd > scheduleEnd) break;

          const isBusy = reservations.some((res) => {
            const resStart = new Date(res.startTime);
            const resEnd = new Date(res.endTime);
            return isTimeOverlap(slotStart, slotEnd, resStart, resEnd);
          });

          if (!isBusy && slotStart >= start && slotEnd <= end) {
            availableSlots.push({
              startTime: slotStart.toISOString(),
              endTime: slotEnd.toISOString(),
            });
          }

          slotStart.setUTCMinutes(slotStart.getUTCMinutes() + 30);
        }
      }

      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    return availableSlots;
  }
}
