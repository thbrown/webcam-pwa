import { Tab, Tabs } from "@blueprintjs/core";
import React, { useRef, useState, useEffect } from "react";
import { CameraPanel } from "./CameraPanel";
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
  const [recordingCount, setRecordingCount] = useState<number | undefined>(
    undefined
  );

  const handleTabChange = (targetPanel: MainPanel) => {
    setMainPanel(targetPanel);
  };

  useEffect(() => {
    const fetchRecordingCount = async () => {
      try {
        const count = await localforage.length();
        setRecordingCount(count);
      } catch (error) {
        console.error("Error fetching recording count:", error);
      }
    };
    fetchRecordingCount();
  });

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
          />
        }
        icon={<Camera />}
      />
      <Tab
        className="no-highlight minimal-top-margin"
        id="recordings"
        title={<div className="spacer">Recordings</div>}
        panel={<RecordingsPanel />}
        icon={<FolderOpen />}
        tagContent={recordingCount}
      />
    </Tabs>
  );
}
// https://gml.noaa.gov/grad/solcalc/table.php?lat=39.74&lon=-104.99&year=2024
