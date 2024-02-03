import { v4 as uuidv4 } from "uuid";
import tsWhammy from "ts-whammy/src/libs";
import localforage from "localforage";
import FileSaver from "file-saver";
import React from "react";
import { convertToWebP } from "./WebpConversionUtil";
import { sideEffectLink } from "../tsWhammyPatch";
import {
  CapturedFrame,
  CompiledVideo,
  RecordingMode,
  SaveImageMetadata,
  SavedVideoMetadata,
} from "../Types";

// If you remove this the whammy monkey patch will not run (since this makes it a dependency and prevents tree shaking from removing it)
console.warn("whammy patch", sideEffectLink);

function uint8ArrayToBlob(
  uint8Array: Uint8Array,
  mimeType = "application/octet-stream"
) {
  // Create a new Blob from the Uint8Array
  return new Blob([uint8Array], { type: mimeType });
}

const isWebP = (base64String: string) => {
  return base64String.startsWith("data:image/webp;base64,");
};

const getSizeInBytes = (input: string[]): number => {
  // Initialize total size
  let totalSize = 0;

  // Iterate through each string in the array
  input.forEach((str) => {
    // Encode the string using TextEncoder and add its length to totalSize
    totalSize += new TextEncoder().encode(str).length;
  });

  // Return the total size in bytes
  return totalSize;
};

export const savePictures = async (
  input: CapturedFrame[],
  previewImage: string,
  reloadSavedImages: () => void,
  width: number,
  height: number
) => {
  const keyUuid = uuidv4();

  const imageMetadata: SaveImageMetadata = {
    size: getSizeInBytes(input.map((v) => v.image)),
    timestamp: Date.now(),
    previewImage: previewImage,
    saveUuid: keyUuid,
    width,
    height,
  };

  try {
    console.log("SAVING IMAGES", keyUuid, input);
    await localforage.setItem(getImageMetadataKey(keyUuid), imageMetadata);
    await localforage.setItem(getImageKey(keyUuid), input);
  } catch (err) {
    console.error(err);
  }
  reloadSavedImages();
  return imageMetadata;
};

export const compileVideo = async (
  inputFrames: string[],
  outputFPS: number
): Promise<CompiledVideo> => {
  try {
    // iOS is frustrating, it produces .png images when I specifically asked for webp
    // Which means we need to do a bunch of extra work to support an additional 10% of users
    // We'll get a png instead and convert it to webp via wasm
    if (inputFrames.some((frame) => !isWebP(frame))) {
      console.log(
        "Browser does not have full support for webp, converting " +
          inputFrames.length +
          " images"
      );
      inputFrames = await convertToWebP(inputFrames);
    }

    let videoBlob = undefined;
    while (inputFrames.length > 0) {
      try {
        videoBlob = tsWhammy.fromImageArray(inputFrames, outputFPS);
        break;
      } catch (err) {
        // Sometimes we can get an error on a partial frame. I think this happens when the browser
        // tab is closed before a complete write to localforage can happen.
        // e.g. "Before toWebM Error, Image Index 31
        if (err.message.includes("Before toWebM Error, Image Index")) {
          const errorMessageParts = err.message.split(" ");
          const lastIndex = errorMessageParts.length - 1;
          const imageIndex = parseInt(errorMessageParts[lastIndex], 10);
          console.warn("Corrupted frame dropped", errorMessageParts);

          if (!isNaN(imageIndex)) {
            // Remove the problematic frame and try again!
            console.warn("Corrupted frame dropped", imageIndex);
            inputFrames.splice(imageIndex, 1);
          } else {
            throw err;
          }
        } else {
          // Re-throw the error if the condition is not met.
          throw err;
        }
      }
    }

    if (inputFrames.length === 0) {
      throw new Error("No valid frames available for compilation");
    }

    // This is to satisfy type checking, I'm not sure it actually can happen
    if (videoBlob instanceof Uint8Array) {
      console.log(
        "webm output is Uint8Array converting... not sure if this is correct"
      );
      return {
        blob: uint8ArrayToBlob(videoBlob),
        previewImage: inputFrames[0],
      };
    }

    return {
      blob: videoBlob,
      previewImage: await resizeBase64Image(inputFrames[0], 50, 41),
    };
  } catch (e) {
    alert("Video compile error: " + e + " - " + e.stack);
  }
};

const METADATA_PREFIX = "metadata_";
const IMAGE_METADATA_PREFIX = "img_metadata_";

function getMetadataKey(keyUuid: string) {
  return METADATA_PREFIX + keyUuid;
}

function getBlobKey(keyUuid: string) {
  return "blob_" + keyUuid;
}

function getImageMetadataKey(keyUuid: string) {
  return IMAGE_METADATA_PREFIX + keyUuid;
}

function getImageKey(keyUuid: string) {
  return "img_blob_" + keyUuid;
}

export const downloadVideo = async (videoBlob: Blob) => {
  // TODO: Date here?
  FileSaver.saveAs(videoBlob, "timelapse.webm");
};

export const getVideoElement = (videoBlob: Blob, style?: object) => {
  const videoUrl = URL.createObjectURL(videoBlob);
  return <video src={videoUrl} style={style} controls autoPlay loop />;
};

export const freeVideoElement = (videoElement: HTMLVideoElement) => {
  // Revoke the object URL to free up memory
  URL.revokeObjectURL(videoElement.src);
};

export const saveVideo = async (
  inputBlob: Blob,
  previewImage: string,
  recordingMode: RecordingMode,
  reloadSavedMedia: () => void,
  width: number,
  height: number
): Promise<SavedVideoMetadata> => {
  const keyUuid = uuidv4();

  const videoMetadata: SavedVideoMetadata = {
    type: recordingMode,
    size: inputBlob.size,
    timestamp: Date.now(),
    previewImage: previewImage,
    saveUuid: keyUuid,
    width,
    height,
  };

  try {
    console.log("SAVING", keyUuid, videoMetadata);
    await localforage.setItem(getMetadataKey(keyUuid), videoMetadata);
    await localforage.setItem(getBlobKey(keyUuid), inputBlob);
  } catch (err) {
    console.error(err);
  }
  reloadSavedMedia();
  return videoMetadata;
};

export const getImageArray = async (keyUuid: string) => {
  return await localforage.getItem<CapturedFrame[] | null>(
    getImageKey(keyUuid)
  );
};

export const getVideoBlob = async (keyUuid: string) => {
  return await localforage.getItem<Blob | null>(getBlobKey(keyUuid));
};

export const getVideoMetadata = async (keyUuid: string) => {
  return await localforage.getItem<Blob | null>(getMetadataKey(keyUuid));
};

export const deleteVideo = async (keyUuid: string) => {
  await localforage.removeItem(getBlobKey(keyUuid));
  await localforage.removeItem(getMetadataKey(keyUuid));
};

export const deleteImages = async (keyUuid: string) => {
  await localforage.removeItem(getImageKey(keyUuid));
  await localforage.removeItem(getImageMetadataKey(keyUuid));
};

export const getAllSavedVideosMetadata = async () => {
  const allStoredPromises: Promise<SavedVideoMetadata | null>[] = [];
  const keys = await localforage.keys();

  for (let key of keys) {
    if (key.startsWith(METADATA_PREFIX)) {
      allStoredPromises.push(
        localforage.getItem<SavedVideoMetadata | null>(key)
      );
    }
  }

  const resolvedPromises = await Promise.all(allStoredPromises);

  // Filter out null values and ensure type safety
  const filteredVideos: SavedVideoMetadata[] = resolvedPromises.filter(
    (video) => video !== null
  ) as SavedVideoMetadata[];

  return filteredVideos.sort((a, b) => b.timestamp - a.timestamp);
};

export const getAllSavedImageMetadata = async () => {
  const allStoredPromises: Promise<SaveImageMetadata | null>[] = [];
  const keys = await localforage.keys();

  for (let key of keys) {
    if (key.startsWith(IMAGE_METADATA_PREFIX)) {
      allStoredPromises.push(
        localforage.getItem<SavedVideoMetadata | null>(key)
      );
    }
  }

  const resolvedPromises = await Promise.all(allStoredPromises);

  // Filter out null values and ensure type safety
  const filteredImages: SavedVideoMetadata[] = resolvedPromises.filter(
    (image) => image !== null
  ) as SavedVideoMetadata[];

  return filteredImages.sort((a, b) => b.timestamp - a.timestamp);
};

async function resizeBase64Image(
  base64: string,
  width: number,
  height: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    let img = new Image();

    img.onload = function () {
      let canvas = document.createElement("canvas");
      let ctx = canvas.getContext("2d");

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL()); // Resized image as base64
    };

    img.onerror = function (error) {
      reject(error);
    };

    img.src = base64;
  });
}

/**
 * Format bytes as human-readable text.
 * https://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable-string
 *
 * @param bytes Number of bytes.
 * @param si True to use metric (SI) units, aka powers of 1000. False to use
 *           binary (IEC), aka powers of 1024.
 * @param dp Number of decimal places to display.
 *
 * @return Formatted string.
 */
export const humanFileSize = (bytes: number, si = false, dp = 1) => {
  const thresh = si ? 1000 : 1024;

  if (Math.abs(bytes) < thresh) {
    return bytes + " B";
  }

  const units = si
    ? ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
    : ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
  let u = -1;
  const r = 10 ** dp;

  do {
    bytes /= thresh;
    ++u;
  } while (
    Math.round(Math.abs(bytes) * r) / r >= thresh &&
    u < units.length - 1
  );

  return bytes.toFixed(dp) + " " + units[u];
};
