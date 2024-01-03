import React, { useRef, useState, useEffect, useMemo } from "react";
import localforage from "localforage";
import { Button, Checkbox, Spinner } from "@blueprintjs/core";
import { RecordingMode, SavedVideo } from "./CameraPanel";
import { Time, Stopwatch, Clean, Download, Trash } from "@blueprintjs/icons";

export function SavedVideoPanel(
  props: SavedVideo & { indexDbKey: string; reloadSavedVideos: () => void }
): JSX.Element {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const handleDownload = (event: React.MouseEvent<HTMLButtonElement>) => {
    console.log("DOWNLOAD", event.target);

    PIZZA;
  };

  const handleDelete = async (event: React.MouseEvent<HTMLButtonElement>) => {
    setIsDeleting(true);
    await localforage.removeItem(props.indexDbKey);
    setIsDeleting(false);
    props.reloadSavedVideos();
  };

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
  const humanFileSize = (bytes: number, si = false, dp = 1) => {
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

  const getIconForType = (type: RecordingMode) => {
    switch (type) {
      case "Timelapse":
        return <Time />;
      case "StopMotion":
        return <Stopwatch />;
      case "Astronomical":
        return <Clean />;
      default:
        // Never
        return "default-icon";
    }
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
      <div>{getIconForType(props.type)}</div>
      <div
        style={{
          textOverflow: "ellipsis",
          maxWidth: "132px",
        }}
      >
        {props.name}
      </div>
      <div>
        <div>{date}</div>
        <div>{time}</div>
      </div>
      <div>{humanFileSize(props.blob.size)}</div>
      <Button large={true} icon={<Download />} onClick={handleDownload} />
      <Button large={true} icon={<Trash />} onClick={handleDelete} />
    </div>
  );
}
