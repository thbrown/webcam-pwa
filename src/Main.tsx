import { Dialog, Tab, Tabs } from "@blueprintjs/core";
import React, { useRef, useState, useEffect, useMemo } from "react";
import { CameraPanel } from "./CameraPanel";
import { RecordingsPanel } from "./RecordingsPanel";
import { FolderOpen, Camera } from "@blueprintjs/icons";
import "./Main.scss";
import { RecordingStatus } from "./App";
import localforage from "localforage";
import {
  SavedVideoMetadata,
  getAllSavedVideosMetadata,
  getVideoElement,
} from "./VideoStorageUtils";

export type MainPanel = "camera" | "recordings";

interface MainProps {
  recordingStatus: RecordingStatus;
  setRecordingStatus: (v: RecordingStatus) => void;
}

export function Main(props: MainProps): JSX.Element {
  const [mainPanel, setMainPanel] = useState<MainPanel>("camera");
  const [savedVideos, setSavedVideos] = useState<
    SavedVideoMetadata[] | undefined
  >(undefined);
  const [videoToShow, setVideoToShow] = useState<Blob | undefined>(undefined);

  const handleShowVideoClose = () => {
    setVideoToShow(undefined);
  };

  const reloadSavedVideos = async (): Promise<SavedVideoMetadata[]> => {
    const allSavedVideoMetadata = await getAllSavedVideosMetadata();
    setSavedVideos(allSavedVideoMetadata);
    return allSavedVideoMetadata;
  };

  // TODO: useEffect here instead
  useMemo(reloadSavedVideos, []);

  const handleTabChange = (targetPanel: MainPanel) => {
    setMainPanel(targetPanel);
  };

  return (
    <>
      <Tabs
        fill={true}
        large={true}
        onChange={handleTabChange}
        selectedTabId={mainPanel}
      >
        <Tab
          className="no-highlight minimal-top-margin"
          id="camera"
          title={<div className="spacer">Camera</div>}
          panel={
            <CameraPanel
              recordingStatus={props.recordingStatus}
              setRecordingStatus={props.setRecordingStatus}
              reloadSavedVideos={reloadSavedVideos}
              setVideoToShow={setVideoToShow}
            />
          }
          icon={<Camera />}
        />
        <Tab
          className="no-highlight minimal-top-margin"
          id="recordings"
          title={<div className="spacer">Recordings</div>}
          panel={
            <RecordingsPanel
              savedVideos={savedVideos}
              reloadSavedVideos={reloadSavedVideos}
              setVideoToShow={setVideoToShow}
            />
          }
          icon={<FolderOpen />}
          tagContent={
            savedVideos === undefined ? undefined : savedVideos.length
          }
        />
      </Tabs>
      {videoToShow !== undefined ? (
        <Dialog
          title="Saved Video"
          isOpen={true}
          isCloseButtonShown={true}
          onClose={handleShowVideoClose}
          style={{ width: "90vw" }}
          icon={<FolderOpen />}
        >
          {getVideoElement(videoToShow)}
        </Dialog>
      ) : null}
    </>
  );
}
