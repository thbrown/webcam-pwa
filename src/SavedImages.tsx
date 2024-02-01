import React, { useRef, useState, useEffect, useMemo } from "react";
import { Button, Checkbox, Spinner } from "@blueprintjs/core";
import { Download, Trash, Play, Media, Record } from "@blueprintjs/icons";
import {
  SaveImageMetadata,
  SavedVideoMetadata,
  deleteImages,
  downloadVideo,
  getImageArray,
  getVideoBlob,
  humanFileSize,
} from "./VideoStorageUtils";
import JSZip from "jszip";
import FileSaver from "file-saver";
export function SavedImages(
  props: SaveImageMetadata & {
    reloadSavedMedia: () => void;
    setVideoToShow: (video: Blob) => void;
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

  const handleRestore = async () => {
    setRecordingStatus("paused");
    setCapturedFrames();
    setResolution();
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
      <Button large={true} icon={<Record />} onClick={handleRestore} />
      <Button large={true} icon={<Download />} onClick={handleDownload} />
      <Button large={true} icon={<Trash />} onClick={handleDelete} />
    </div>
  );
}
