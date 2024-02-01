import React, { useRef, useState, useEffect, useMemo } from "react";
import { Spinner } from "@blueprintjs/core";
import { SavedImages } from "./SavedImages";
import {
  CapturedFrame,
  MainPanel,
  RecordingMode,
  RecordingStatus,
  SaveImageMetadata,
} from "../Types";

interface RecordingPanelProps {
  savedImages: SaveImageMetadata[];
  reloadSavedMedia: () => void;
  setImagesToShow: (images: CapturedFrame[]) => void;
  setCameraSettings: (value: MediaTrackSettings) => void;
  setRecordingMode: (value: RecordingMode) => void;
  setCapturedFrames: (value: CapturedFrame[]) => void;
  setRecordingStatus: (value: RecordingStatus) => void;
  setMainPanel: (value: MainPanel) => void;
}

export function SavedImagesPanel(props: RecordingPanelProps): JSX.Element {
  // Loading...
  if (props.savedImages === undefined) {
    return (
      <div>
        <Spinner size={64} />
      </div>
    );
  }

  if (props.savedImages.length === 0) {
    return (
      <div style={{ margin: "50px", textAlign: "center" }}>
        There are currently no saved images.
      </div>
    );
  }

  const panels: JSX.Element[] = props.savedImages.map((video) => (
    // TODO: use spread op here somehow if it's possible?
    <SavedImages
      size={video.size}
      timestamp={video.timestamp}
      saveUuid={video.saveUuid}
      previewImage={video.previewImage}
      key={video.saveUuid}
      reloadSavedMedia={props.reloadSavedMedia}
      setImagesToShow={props.setImagesToShow}
      width={video.width}
      height={video.height}
      setCameraSettings={props.setCameraSettings}
      setRecordingMode={props.setRecordingMode}
      setCapturedFrames={props.setCapturedFrames}
      setRecordingStatus={props.setRecordingStatus}
      setMainPanel={props.setMainPanel}
    />
  ));

  return (
    <div>
      <div
        style={{
          marginLeft: "10px",
          marginRight: "10px",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div>Img</div>
        <div>Date/Time</div>
        <div>Size</div>
        <div>View</div>
        <div>Restore</div>
        <div>Download</div>
        <div>Delete</div>
      </div>
      {panels}
    </div>
  );
}
