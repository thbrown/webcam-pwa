import { RecordingMode, getIndexDbRefFromSequence } from "./CameraPanel";
import { v4 as uuidv4 } from "uuid";
import tsWhammy from "ts-whammy/src/libs";
import localforage from "localforage";
import FileSaver from "file-saver";
import React from "react";

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

export const compileVideo = async (
  inputFrames: string[],
  outputFPS: number
): Promise<CompiledVideo> => {
  const videoBlob = tsWhammy.fromImageArray(inputFrames, outputFPS);

  // This is to satisfy type checking, I'm not sure it actually can happen
  if (videoBlob instanceof Uint8Array) {
    console.log(
      "webm output is Uint8Array converting... not sure if this is correct"
    );
    return { blob: uint8ArrayToBlob(videoBlob), previewImage: inputFrames[0] };
  }

  console.log("COMPILED VIDEO", videoBlob);
  return {
    blob: videoBlob,
    previewImage: await resizeBase64Image(inputFrames[0], 50, 41),
  };
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
  /*

  // TODO: can we append a hidden link to body? Or can we click a link with display: none?
  const playbackContainer = document.getElementById(
    "timelapsePlaybackContainer"
  );
  const downloadLinkContainer = document.getElementById("downloadLink");
  if (playbackContainer) {
    playbackContainer.innerHTML = "";
    playbackContainer.appendChild(videoElement);

    // Provide download link for the video
    const downloadLink = document.createElement("a");
    downloadLink.href = videoUrl;
    downloadLink.download = "timelapse.webm";
    downloadLink.textContent = "Download Timelapse Video";
    downloadLinkContainer.appendChild(downloadLink);
  }

  // Revoke the object URL to free up memory
  URL.revokeObjectURL(videoUrl);
  */
  // Stop the video stream
  /*
  if (videoRef.current && videoRef.current.srcObject) {
    const mediaStream = videoRef.current.srcObject as MediaStream;
    mediaStream.getTracks().forEach(track => track.stop());
    videoRef.current.srcObject = null;
  }
  */
};

/*
export const getVideoElement = (videoBlob: Blob) => {
  const videoUrl = URL.createObjectURL(videoBlob);
  const videoElement = document.createElement("video");
  videoElement.src = videoUrl;
  videoElement.controls = true;
  videoElement.autoplay = true;
  return videoElement;
};
*/

export const getVideoElement = (videoBlob: Blob, style?: object) => {
  const videoUrl = URL.createObjectURL(videoBlob);
  return <video src={videoUrl} style={style} controls autoPlay />;
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
  const length = await localforage.length();

  for (let i = 0; i < length; i++) {
    const key = await localforage.key(i);
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

  return filteredVideos;
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
