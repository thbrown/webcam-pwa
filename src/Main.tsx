import { Tab, Tabs } from "@blueprintjs/core";
import React, { useRef, useState, useEffect, useMemo } from "react";
import { CameraPanel, SavedVideo } from "./CameraPanel";
import { RecordingsPanel } from "./RecordingsPanel";
import { FolderOpen, Camera } from "@blueprintjs/icons";
import "./Main.scss";
import { RecordingStatus } from "./App";
import localforage from "localforage";

export type MainPanel = "camera" | "recordings";

interface MainProps {
  recordingStatus: RecordingStatus;
  setRecordingStatus: (v: RecordingStatus) => void;
}

export function Main(props: MainProps): JSX.Element {
  const [mainPanel, setMainPanel] = useState<MainPanel>("camera");
  const [savedVideos, setSavedVideos] = useState<SavedVideo[] | undefined>(
    undefined
  );

  const reloadSavedVideos = async (): Promise<SavedVideo[]> => {
    const allStoredPromises: Promise<SavedVideo | null>[] = [];
    const length = await localforage.length();

    for (let i = 0; i < length; i++) {
      allStoredPromises.push(
        localforage.getItem<SavedVideo | null>(await localforage.key(i))
      );
    }

    const resolvedPromises = await Promise.all(allStoredPromises);

    // Filter out null values and ensure type safety
    const filteredVideos: SavedVideo[] = resolvedPromises.filter(
      (video) => video !== null
    ) as SavedVideo[];

    setSavedVideos(filteredVideos);

    return filteredVideos;
  };

  useMemo(reloadSavedVideos, []);

  const handleTabChange = (targetPanel: MainPanel) => {
    setMainPanel(targetPanel);
  };

  return (
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
          />
        }
        icon={<FolderOpen />}
        tagContent={savedVideos === undefined ? undefined : savedVideos.length}
      />
    </Tabs>
  );
}
// https://gml.noaa.gov/grad/solcalc/table.php?lat=39.74&lon=-104.99&year=2024
