import { v4 as uuidv4 } from "uuid";
import tsWhammy from "ts-whammy/src/libs";
import localforage from "localforage";
import FileSaver from "file-saver";
import React from "react";
import { convertToWebP } from "./WebpConversionUtil";
import {
  CapturedFrame,
  CompiledVideo,
  RecordingMode,
  SaveImageMetadata,
  SavedVideoMetadata,
} from "../Types";
//import WhammyWorker from "./whammy.worker.ts";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

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
  outputFPS: number,
  updateProgress: (message: string) => void,
  mode: "whammy" | "ffmpeg"
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
      inputFrames = await convertToWebP(inputFrames, updateProgress);
    }

    let videoBlob = undefined;

    if (mode === "whammy") {
      console.log("Compiling video with whammy", inputFrames.length); /*
      while (inputFrames.length > 0) {
        try {
          videoBlob = await whammyWebWorker(inputFrames, outputFPS, (val) => {
            console.log("GOT PROGRESS", val);
            updateProgress(
              `Parsing Frames ${parseInt(val) + 1} of ${inputFrames.length}`
            );
          });
          break;
        } catch (err) {
          if (err.message.includes("Before toWebM Error, Image Index")) {
            const errorMessageParts = err.message.split(" ");
            const lastIndex = errorMessageParts.length - 1;
            const imageIndex = parseInt(errorMessageParts[lastIndex], 10);
            console.warn("Corrupted frame dropped", errorMessageParts);

            if (!isNaN(imageIndex)) {
              console.warn("Corrupted frame dropped", imageIndex);
              inputFrames.splice(imageIndex, 1);
            } else {
              throw err;
            }
          } else {
            alert(err);
            throw err;
          }
        }
      }*/
    } else if (mode === "ffmpeg") {
      console.log("Compiling video with ffmpeg", inputFrames.length);
      const ffmpeg = new FFmpeg();
      if (!ffmpeg.loaded) {
        await ffmpeg.load(); // Ensure FFmpeg is loaded before use
      }

      // Write each frame to the FFmpeg virtual filesystem
      for (let i = 0; i < inputFrames.length; i++) {
        const frameBlob = await fetchFile(inputFrames[i]);
        console.log("Writing frame to virtual filesystem", i);
        await ffmpeg.writeFile(`frame-${i}.webp`, frameBlob);
      }

      // Assuming all frames have the same size, get the first frame's dimensions
      const { width, height } = await getImageDimensions(inputFrames[0]);

      // Dynamically calculate bitrate
      const bitrate = calculateBitrate(width, height, outputFPS);
      console.log(`Using dynamic bitrate: ${bitrate}Kbps`);

      // Run FFmpeg command to convert image sequence into a WebM video
      const params = [
        "-framerate",
        outputFPS.toString(), // Set input frame rate
        "-i",
        "frame-%d.webp", // Input pattern for sequential frames
        "-c:v",
        "libvpx", // Use VP8 codec (more stable in WASM, "libvpx-vp9" gives mem issues)
        "-b:v",
        `${bitrate}K`, // Lower bitrate to reduce memory usage
        "-vf",
        "scale=640:-2,format=yuv420p",
        "-deadline",
        "good", // Lower CPU usage "realtime", "good", "best")
        "-cpu-used",
        "4", // Increase speed, but lower efficiency (0=best, 5=fastest)
        "-an", // No audio
        "output.webm", // Output file
      ];
      console.log("Running ffmpeg command", params);
      ffmpeg.on("progress", ({ progress }) => {
        const progressString = (progress * 100).toFixed(1);
        updateProgress(`${progressString}% complete`);
        console.log("Progress", progressString);
      });
      await ffmpeg.exec(params);

      // Delete files in temp virtual directory
      for (let i = 0; i < inputFrames.length; i++) {
        await ffmpeg.deleteFile(`frame-${i}.webp`);
      }

      // Read the output video file
      const fileData = await ffmpeg.readFile("output.webm");
      videoBlob = new Blob([fileData], { type: "video/webm" });
      await ffmpeg.deleteFile("output.webm");
    }

    if (inputFrames.length === 0) {
      throw new Error("No valid frames available for compilation");
    }

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
    console.error("Video compile error", e);
  }
  console.log("Done compiling video");
};

/*
const whammyWebWorker = async (
  images: string[],
  fps: number,
  updateProgress: (a: string) => void
) => {
  // Create a Web Worker and execute the tsWhammy.fromImageArray inside it
  //@ts-ignore
  const worker = new WhammyWorker();
  const resultPromise = new Promise<Blob | Uint8Array>((resolve) => {
    worker.onmessage = (event: { data: { type: string; value: any } }) => {
      if (event.data.type === "Result") {
        resolve(event.data.value as Blob | Uint8Array);
      } else if (event.data.type === "Progress") {
        updateProgress(event.data.value as string);
      } else {
        console.warn("Unrecognized web worker message", event.data);
      }
    };
  });

  // Start the Web Worker and wait for the result
  worker.postMessage({
    images,
    fps,
  });
  const result = await resultPromise;

  // Clean up the Web Worker
  worker.terminate();

  return result;
};
*/

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

export async function resizeBase64Image(
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

// Function to compute dynamic bitrate
// Idk if this is actually any good, but it's a start
function calculateBitrate(width: number, height: number, fps: number) {
  return Math.round(width * height * fps * 0.07); // Adjust multiplier as needed
}

// Extract width and height from an image
async function getImageDimensions(url: string): Promise<{
  width: number;
  height: number;
}> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.src = url;
  });
}
