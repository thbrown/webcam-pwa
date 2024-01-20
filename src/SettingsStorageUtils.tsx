import localforage from "localforage";

const SETTINGS_PREFIX = "settings_";
const FRAMES_PREFIX = "frame_";

function getSettingsKey(keyUuid: string) {
  return SETTINGS_PREFIX + keyUuid;
}

function getFramesKey(keyUuid: string) {
  return FRAMES_PREFIX + keyUuid;
}

export const getSetting = async <T,>(
  settingName: string
): Promise<T | null> => {
  return await localforage.getItem<T | null>(getSettingsKey(settingName));
};

export const setSetting = async <T,>(
  settingName: string,
  settingValue: T
): Promise<void> => {
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
    const numA = parseInt(a.match(/\d*/)[0]);
    const numB = parseInt(b.match(/\d*/)[0]);

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
    console.log("sorted key", key);
    allStoredPromises.push(localforage.getItem<any | null>(key));
  }
  return await Promise.all(allStoredPromises);
};

export const saveFrame = async (frame: any) => {
  const length = await localforage.length();
  console.log("Getting saved frames", length);
  let counter = 0;
  for (let i = 0; i < length; i++) {
    const key = await localforage.key(i);
    if (key && key.startsWith(FRAMES_PREFIX)) {
      counter++;
    }
  }
  return await localforage.setItem<any | null>(
    getFramesKey(String(counter)),
    frame
  );
};

export const clearFrames = async () => {
  const allStoredPromises: Promise<void>[] = [];
  const keys = await localforage.keys();
  console.log("Getting saved frames", keys);
  for (let key of keys) {
    console.log("clear key", key);
    if (key && key.startsWith(FRAMES_PREFIX)) {
      allStoredPromises.push(localforage.removeItem(key));
    }
  }
  return await Promise.all(allStoredPromises);
};
