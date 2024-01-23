import { RecordingMode } from "./CameraPanel";
import { v4 as uuidv4 } from "uuid";
import tsWhammy from "ts-whammy/src/libs";
import localforage from "localforage";
import FileSaver from "file-saver";
import React from "react";
import { convertToWebP } from "./WebpConversionUtil";
import { sideEffectLink } from "./tsWhammyPatch";

console.warn("whammy patch", sideEffectLink);

export type SavedVideoMetadata = {
  type: RecordingMode;
  timestamp: number;
  size: number;
  saveUuid: string;
  previewImage: string;
};

function uint8ArrayToBlob(
  uint8Array: Uint8Array,
  mimeType = "application/octet-stream"
) {
  // Create a new Blob from the Uint8Array
  return new Blob([uint8Array], { type: mimeType });
}

export type CompiledVideo = {
  blob: Blob;
  previewImage: string;
};

const isWebP = (base64String: string) => {
  return base64String.startsWith("data:image/webp;base64,");
};

export const compileVideo = async (
  inputFrames: string[],
  outputFPS: number
): Promise<CompiledVideo> => {
  try {
    // iOS is frustrating, it produces pngs when I specifically asked for webp
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
            console.warn("Corrupted frame dropped", imageIndex, inputFrames);
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

function getMetadataKey(keyUuid: string) {
  return METADATA_PREFIX + keyUuid;
}

function getBlobKey(keyUuid: string) {
  return "blob_" + keyUuid;
}

export const downloadVideo = async (videoBlob: Blob) => {
  // TODO: Prompt here for file name?
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
  reloadSavedVideos: () => void
): Promise<SavedVideoMetadata> => {
  const keyUuid = uuidv4();

  const videoMetadata: SavedVideoMetadata = {
    type: recordingMode,
    size: inputBlob.size,
    timestamp: Date.now(),
    previewImage: previewImage,
    saveUuid: keyUuid,
  };

  try {
    console.log("SAVING", keyUuid, videoMetadata);
    await localforage.setItem(getMetadataKey(keyUuid), videoMetadata);
    await localforage.setItem(getBlobKey(keyUuid), inputBlob);
  } catch (err) {
    console.error(err);
  }
  reloadSavedVideos();
  return videoMetadata;
};

export const getVideoBlob = async (keyUuid: string) => {
  return await localforage.getItem<Blob | null>(getBlobKey(keyUuid));
};

export const getVideoMetadata = async (keyUuid: string) => {
  return await localforage.getItem<Blob | null>(getMetadataKey(keyUuid));
};

export const deleteVideo = async (keyUuid: string) => {
  await localforage.removeItem(getMetadataKey(keyUuid));
  await localforage.removeItem(getBlobKey(keyUuid));
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
