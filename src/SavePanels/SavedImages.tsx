import React, { useRef, useState, useEffect, useMemo } from "react";
import { Button, Checkbox, Spinner } from "@blueprintjs/core";
import { Download, Trash, Play, Media, Record, Redo } from "@blueprintjs/icons";
import {
  deleteImages,
  downloadVideo,
  getImageArray,
  getVideoBlob,
  humanFileSize,
} from "../Utils/VideoStorageUtils";
import JSZip from "jszip";
import FileSaver from "file-saver";
import {
  CapturedFrame,
  MainPanel,
  RecordingMode,
  RecordingStatus,
  SaveImageMetadata,
} from "../Types";
import { uniqueId } from "lodash";
export function SavedImages(
  props: SaveImageMetadata & {
    reloadSavedMedia: () => void;
    setVideoToShow: (video: Blob) => void;
    setCameraSettings: (value: MediaTrackSettings) => void;
    setRecordingMode: (value: RecordingMode) => void;
    setCapturedFrames: (value: CapturedFrame[]) => void;
    setRecordingStatus: (value: RecordingStatus) => void;
    setMainPanel: (value: MainPanel) => void;
  }
): JSX.Element {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const handleDownload = async (event: React.MouseEvent<HTMLButtonElement>) => {
    const images = await getImageArray(props.saveUuid);
    const zip = new JSZip();

    const imageZip = zip.folder("images");
    let index = 0;
    for (let img of images) {
      const idx = img.image.indexOf("base64,") + "base64,".length; // or = 28 if you're sure about the prefix
      const content = img.image.substring(idx);
      imageZip.file(`frame${index}.webp`, content, { base64: true });
      index++;
    }

    const content = await zip.generateAsync({ type: "blob" });
    FileSaver.saveAs(content, "images.zip");
  };

  const handleDelete = async (event: React.MouseEvent<HTMLButtonElement>) => {
    setIsDeleting(true);
    await deleteImages(props.saveUuid);
    setIsDeleting(false);
    props.reloadSavedMedia();
  };

  const handlePlay = async (event: React.MouseEvent<HTMLButtonElement>) => {
    // TODO
  };

  const handleRestore = async () => {
    const images = await getImageArray(props.saveUuid);
    const mode = images[0].type.mode;

    props.setMainPanel("camera");
    props.setRecordingStatus("Paused");
    props.setRecordingMode(mode);
    props.setCapturedFrames(images);
    // TODO: does this work for landscape and portrait modes?
    // TODO: what happens if camera permissions aren't granted?
    props.setCameraSettings({ width: props.width, height: props.height });
  };

  const date = new Date(props.timestamp).toLocaleDateString("en-US");
  const time = new Date(props.timestamp).toLocaleTimeString("en-US");

  if (isDeleting) {
    // TODO: CSS THIS
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "4px",
          margin: "6px",
          justifyContent: "space-between",
          backgroundColor: "lightgrey",
          borderRadius: "3px",
          boxShadow: "0 3px 10px rgb(0 0 0 / .2)",
        }}
      >
        <Spinner size={16} />
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "4px",
        margin: "6px",
        justifyContent: "space-between",
        backgroundColor: "lightgrey",
        borderRadius: "3px",
      }}
    >
      <div>
        <img
          style={{ borderRadius: "3px" }}
          id="myImage"
          src={props.previewImage}
          alt="Image from String"
        />
      </div>
      <div>
        <div>{date}</div>
        <div>{time}</div>
      </div>
      <div>{humanFileSize(props.size)}</div>
      <Button large={true} icon={<Play />} onClick={handlePlay} />
      <Button large={true} icon={<Redo />} onClick={handleRestore} />
      <Button large={true} icon={<Download />} onClick={handleDownload} />
      <Button large={true} icon={<Trash />} onClick={handleDelete} />
    </div>
  );
}
