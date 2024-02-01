import React, { useRef, useState, useEffect, useMemo } from "react";
import localforage from "localforage";
import { Button, Checkbox, Spinner } from "@blueprintjs/core";
import { RecordingMode } from "./CameraPanel";
import {
  Time,
  Stopwatch,
  Flash,
  Download,
  Trash,
  Play,
  Media,
} from "@blueprintjs/icons";
import {
  SaveImageMetadata,
  SavedVideoMetadata,
  deleteImages,
  downloadVideo,
  getVideoBlob,
  humanFileSize,
} from "./VideoStorageUtils";

export function SavedImages(
  props: SaveImageMetadata & {
    reloadSavedMedia: () => void;
    setVideoToShow: (video: Blob) => void;
  }
): JSX.Element {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const handleDownload = async (event: React.MouseEvent<HTMLButtonElement>) => {
    //console.log("DOWNLOAD", event.target);
    //downloadVideo(await getVideoBlob(props.saveUuid));
    // PIZZA
  };

  const handleDelete = async (event: React.MouseEvent<HTMLButtonElement>) => {
    setIsDeleting(true);
    await deleteImages(props.saveUuid);
    setIsDeleting(false);
    props.reloadSavedMedia();
  };

  const handleREstore = async () => {
    // PIZZA
  };

  const handlePlayVideo = async () => {
    // PIZZA
    //props.setVideoToShow(await getVideoBlob(props.saveUuid));
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
      <div style={{ marginLeft: "10px" }}>{<Media></Media>}</div>
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
      <Button large={true} icon={<Play />} onClick={handlePlayVideo} />
      <Button large={true} icon={<Download />} onClick={handleDownload} />
      <Button large={true} icon={<Trash />} onClick={handleDelete} />
    </div>
  );
}
