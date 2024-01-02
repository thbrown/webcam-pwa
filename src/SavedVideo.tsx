import React, { useRef, useState, useEffect, useMemo } from "react";
import localforage from "localforage";
import { Button, Checkbox, Spinner } from "@blueprintjs/core";
import { RecordingMode, SavedVideo } from "./CameraPanel";
import { Time, Stopwatch, Clean, Download, Trash } from "@blueprintjs/icons";
import { BUTTON } from "@blueprintjs/core/lib/esm/common/classes";

export function SavedVideoPanel(
  props: SavedVideo & { indexDbKey: string }
): JSX.Element {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const handleDownload = (event: React.MouseEvent<HTMLButtonElement>) => {
    console.log("DOWNLOAD", event.target);
  };

  const handleDelete = async (event: React.MouseEvent<HTMLButtonElement>) => {
    setIsDeleting(true);
    await localforage.removeItem(props.indexDbKey);
    setIsDeleting(false);
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
      <Button large={true} icon={<Download />} onClick={handleDownload} />
      <Button large={true} icon={<Trash />} onClick={handleDelete} />
    </div>
  );
}
