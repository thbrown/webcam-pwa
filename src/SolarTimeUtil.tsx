import SunCalc from "suncalc";

export interface CaptureTime {
  type: string;
  time: any;
}

/**
 * A sorted array of capture times for today and tomorrow with past times filtered out
 */
export const getTimes = (latitude: number, longitude: number) => {
  // Get the current date
  const currentDate = new Date();

  // Get the times for today
  const timesToday = SunCalc.getTimes(currentDate, latitude, longitude);

  // Get the times for tomorrow
  const tomorrowDate = new Date(currentDate);
  tomorrowDate.setDate(currentDate.getDate() + 1); // Increment the date to get tomorrow's date
  const timesTomorrow = SunCalc.getTimes(tomorrowDate, latitude, longitude);

  // Combine times for both days into an array of objects
  const combinedTimes = [
    ...Object.entries(timesToday).map(([type, time]) => ({ type, time })),
    ...Object.entries(timesTomorrow).map(([type, time]) => ({ type, time })),
  ];

  // Sort the combined times array by time
  combinedTimes.sort((a, b) => a.time - b.time);

  // Filter out times that occurred before the current time
  return combinedTimes.filter((item) => item.time > currentDate);
};

export const getUniqueTypes = (times: CaptureTime[]): CaptureTime[] => {
  const uniqueTypes: Set<string> = new Set();
  const uniqueObjects: CaptureTime[] = [];

  times.forEach((timeObject) => {
    if (!uniqueTypes.has(timeObject.type)) {
      uniqueTypes.add(timeObject.type);
      uniqueObjects.push(timeObject);
    }
  });

  return uniqueObjects;
};

export const millisecondsUntilDate = (
  targetDate: Date,
  currentTime?: number
): number => {
  const currentDate = new Date();
  const timeDifference =
    targetDate.getTime() - (currentTime ?? currentDate.getTime());
  return Math.max(timeDifference, 0); // Ensure the result is non-negative
};
