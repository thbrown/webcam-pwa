import React, { useRef, useState, useEffect, useMemo } from "react";
import { Spinner } from "@blueprintjs/core";
import { SavedVideo } from "./SavedVideo";
import { SavedVideoMetadata } from "../Types";

interface SavedVideosPanelProps {
  savedVideos: SavedVideoMetadata[];
  reloadSavedMedia: () => void;
  setVideoToShow: (video: Blob) => void;
}

export function SavedVideosPanel(props: SavedVideosPanelProps): JSX.Element {
  // Loading...
  if (props.savedVideos === undefined) {
    return (
      <div>
        <Spinner size={64} />
      </div>
    );
  }

  if (props.savedVideos.length === 0) {
    return (
      <div style={{ margin: "50px", textAlign: "center" }}>
        There are currently no saved videos.
      </div>
    );
  }

  const panels: JSX.Element[] = props.savedVideos.map((video) => (
    // TODO: use spread op here somehow if it's possible?
    <SavedVideo
      type={video.type}
      size={video.size}
      timestamp={video.timestamp}
      saveUuid={video.saveUuid}
      previewImage={video.previewImage}
      key={video.saveUuid}
      reloadSavedMedia={props.reloadSavedMedia}
      setVideoToShow={props.setVideoToShow}
      width={video.width}
      height={video.height}
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
        <div>Type</div>
        <div>Img</div>
        <div>Date/Time</div>
        <div>Size</div>
        <div>Play</div>
        <div>Download</div>
        <div>Delete</div>
      </div>
      {panels}
    </div>
  );
}
