//@ts-ignore - https://github.com/Hypnos3/suncalc3/issues/4
import SunCalc from "suncalc3";

export interface CaptureTime {
  type: string;
  time: Date;
}

/**
 * A sorted array of capture times for today and tomorrow with past times filtered out
 */
export const getTimes = (latitude: number, longitude: number) => {
  // Get the current date
  const currentDate = new Date();

  // Get the times for today
  const timesToday = SunCalc.getSunTimes(currentDate, latitude, longitude);

  // Get the times for tomorrow
  const tomorrowDate = new Date(currentDate);
  tomorrowDate.setDate(currentDate.getDate() + 1); // Increment the date to get tomorrow's date
  const timesTomorrow = SunCalc.getSunTimes(tomorrowDate, latitude, longitude);

  type ObjectWithStringProperties = {
    [key: string]: any;
  };

  // Combine times for both days into an array of objects
  const combinedTimes = [
    ...Object.entries(timesToday).map(([type, value]) => ({
      type,
      time: (value as ObjectWithStringProperties).value as Date,
    })),
    ...Object.entries(timesTomorrow).map(([type, value]) => ({
      type,
      time: (value as ObjectWithStringProperties).value as Date,
    })),
  ];

  // TO memo this somehow
  //console.log("COMBO TIMES", combinedTimes);

  // Sort the combined times array by time
  combinedTimes.sort((a, b) => a.time.getTime() - b.time.getTime());

  // Filter out times that occurred before the current time
  return combinedTimes.filter((item) => item.time > currentDate);
};

const filterDeprecatedObjects = (obj: { [x: string]: any }) => {
  const filteredObj = {} as { [x: string]: any };

  for (const key in obj) {
    if (!key.includes("[") && !key.includes("]")) {
      filteredObj[key] = obj[key];
    }
  }

  return filteredObj;
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
