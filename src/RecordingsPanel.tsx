import React, { useRef, useState, useEffect, useMemo } from "react";
import localforage from "localforage";
import { Spinner } from "@blueprintjs/core";
import { SavedVideo, getIndexDbRefFromSequence } from "./CameraPanel";
import { SavedVideoPanel } from "./SavedVideo";

interface RecordingPanelProps {
  savedVideos: SavedVideo[];
  reloadSavedVideos: () => void;
}

export function RecordingsPanel(props: RecordingPanelProps): JSX.Element {
  // Loading...
  if (props.savedVideos === undefined) {
    return (
      <div>
        <Spinner size={64} />
      </div>
    );
  }

  const panels: JSX.Element[] = props.savedVideos.map((video, index) => (
    <SavedVideoPanel
      name={video.name}
      type={video.type}
      blob={video.blob}
      timestamp={video.timestamp}
      indexDbKey={getIndexDbRefFromSequence(video.type, video.timestamp)}
      key={index}
      reloadSavedVideos={props.reloadSavedVideos}
    />
  ));

  return <div>{panels}</div>;
}
