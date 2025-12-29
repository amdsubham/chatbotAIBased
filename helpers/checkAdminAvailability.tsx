import { Selectable } from "kysely";
import { AvailabilitySlots } from "./schema";

const DAY_MAP: { [key: string]: number } = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

type NextAvailableSlot = {
  day: string;
  startTime: string;
  timezone: string;
} | null;

interface AvailabilityCheckResult {
  isAvailable: boolean;
  nextAvailableSlot: NextAvailableSlot;
}

/**
 * Server-side function to determine if an admin is currently available for live chat.
 * It checks availability slots against the current time, respecting the timezones specified in each slot.
 *
 * @param slots - Array of availability slots from the database
 * @returns An object containing:
 * - `isAvailable`: boolean - True if an admin is currently available.
 * - `nextAvailableSlot`: object | null - Details of the next upcoming slot if not currently available.
 */
export const checkAdminAvailability = (
  slots: Selectable<AvailabilitySlots>[]
): AvailabilityCheckResult => {
  const enabledSlots = slots.filter((slot) => slot.enabled);
  if (enabledSlots.length === 0) {
    return {
      isAvailable: false,
      nextAvailableSlot: null,
    };
  }

  const now = new Date();
  let isAvailable = false;

  for (const slot of enabledSlots) {
    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: slot.timezone,
        weekday: "short",
        hour: "numeric",
        minute: "numeric",
        hour12: false,
      });

      const parts = formatter.formatToParts(now);
      const currentDayStr = parts.find((p) => p.type === "weekday")?.value;
      const currentHourStr = parts.find((p) => p.type === "hour")?.value;
      const currentMinuteStr = parts.find((p) => p.type === "minute")?.value;

      if (!currentDayStr || !currentHourStr || !currentMinuteStr) {
        console.error("Could not parse current time in slot timezone", {
          timezone: slot.timezone,
        });
        continue;
      }

      const currentDay = DAY_MAP[currentDayStr];
      const currentTime =
        parseInt(currentHourStr, 10) * 60 + parseInt(currentMinuteStr, 10);

      const [startHour, startMinute] = slot.startTime.split(":").map(Number);
      const startTime = startHour * 60 + startMinute;

      const [endHour, endMinute] = slot.endTime.split(":").map(Number);
      const endTime = endHour * 60 + endMinute;

      if (
        currentDay === slot.dayOfWeek &&
        currentTime >= startTime &&
        currentTime < endTime
      ) {
        isAvailable = true;
        break; // Found an active slot, no need to check further
      }
    } catch (e) {
      if (e instanceof Error) {
        // This can happen if the timezone string from the DB is invalid
        console.error(
          `Invalid timezone identifier: '${slot.timezone}'. Skipping slot.`,
          e.message
        );
      }
      continue;
    }
  }

  if (isAvailable) {
    return {
      isAvailable: true,
      nextAvailableSlot: null,
    };
  }

  // If not available, find the next available slot
  let nextAvailableSlot: NextAvailableSlot = null;
  let minTimeDiff = Infinity;

  const localDay = now.getDay();
  const localTime = now.getHours() * 60 + now.getMinutes();

  for (const slot of enabledSlots) {
    const slotDay = slot.dayOfWeek;
    const [startHour, startMinute] = slot.startTime.split(":").map(Number);
    const slotStartTime = startHour * 60 + startMinute;

    let dayDiff = slotDay - localDay;
    if (dayDiff < 0) {
      dayDiff += 7; // It's in the next week
    }

    let timeDiff;
    if (dayDiff === 0) {
      // Slot is for today
      if (slotStartTime > localTime) {
        timeDiff = slotStartTime - localTime;
      } else {
        // Today's slot has passed, so it's next week
        timeDiff = 7 * 24 * 60 + (slotStartTime - localTime);
      }
    } else {
      // Slot is for a future day
      timeDiff = dayDiff * 24 * 60 + (slotStartTime - localTime);
    }

    if (timeDiff < minTimeDiff) {
      minTimeDiff = timeDiff;
      nextAvailableSlot = {
        day: DAY_NAMES[slot.dayOfWeek],
        startTime: slot.startTime,
        timezone: slot.timezone,
      };
    }
  }

  return {
    isAvailable: false,
    nextAvailableSlot,
  };
};