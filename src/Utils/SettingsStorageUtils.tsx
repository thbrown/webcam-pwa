import localforage from "localforage";

const SETTINGS_PREFIX = "settings_";
const FRAMES_PREFIX = "frame_";

function getSettingsKey(keyUuid: string) {
  return SETTINGS_PREFIX + keyUuid;
}

function getFramesKey(keyUuid: string) {
  return FRAMES_PREFIX + keyUuid;
}

export const updateSetting = async (key: string, setter: any) => {
  const value = await getSetting(key);
  if (value !== null) setter(value);
};

export const getSetting = async <T,>(
  settingName: string
): Promise<T | null> => {
  const result = await localforage.getItem<T | null>(
    getSettingsKey(settingName)
  );
  console.log("Getting ", getSettingsKey(settingName), result);
  return result ?? null;
};

export const setSetting = async <T,>(
  settingName: string,
  settingValue: T
): Promise<void> => {
  console.log("Setting ", getSettingsKey(settingName), settingValue);
  await localforage.setItem<T | null>(
    getSettingsKey(settingName),
    settingValue
  );
};

// We implement some special logic for saving frames since saving the whole array each frame capture seems likely to affect performance
// TODO: move types into their own files so we can use CapturedFrame here without creating a circular dep
export const getSavedFrames = async () => {
  const allStoredPromises: Promise<any | null>[] = [];
  const keys = await localforage.keys();
  const filteredKeys = keys.filter((k) => k.startsWith(FRAMES_PREFIX));

  filteredKeys.sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)[0]);
    const numB = parseInt(b.match(/\d+/)[0]);

    if (numA < numB) {
      return -1;
    } else if (numA > numB) {
      return 1;
    } else {
      // If numbers are equal, compare the entire string
      return a.localeCompare(b);
    }
  });

  console.log("Getting saved frames", filteredKeys);
  for (let key of filteredKeys) {
    allStoredPromises.push(localforage.getItem<any | null>(key));
  }
  return await Promise.all(allStoredPromises);
};

export const saveFrame = async (frame: any, index: number) => {
  await localforage.setItem<any | null>(getFramesKey(String(index)), frame);
  console.log("Frame saved ", index);
  return;
};

export const clearFrames = async () => {
  const allStoredPromises: Promise<void>[] = [];
  const keys = await localforage.keys();
  for (let key of keys) {
    if (key && key.startsWith(FRAMES_PREFIX)) {
      allStoredPromises.push(localforage.removeItem(key));
    }
  }
  await Promise.all(allStoredPromises);
  return;
};

// Order matters here (later settings will be applied later, put more important things last)
export const groupedSettings: (keyof MediaTrackSettings)[][] = [
  [
    "whiteBalanceMode" as keyof MediaTrackSettings,
    "colorTemperature" as keyof MediaTrackSettings,
  ],
  [
    "focusMode" as keyof MediaTrackSettings,
    "focusDistance" as keyof MediaTrackSettings,
  ],
  [
    "exposureMode" as keyof MediaTrackSettings,
    "exposureTime" as keyof MediaTrackSettings,
  ],
  [
    "width" as keyof MediaTrackSettings,
    "height" as keyof MediaTrackSettings,
    "aspectRatio" as keyof MediaTrackSettings,
  ],
];
