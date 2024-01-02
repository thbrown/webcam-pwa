import React, { useState } from "react";
import { Main } from "./Main";
import "./App.scss";

export type RecordingStatus = "Stopped" | "Recording" | "Paused";

export const App: React.FC = () => {
  const [recordingStatus, setRecordingStatus] =
    useState<RecordingStatus>("Stopped");

  let backgroundColor;

  switch (recordingStatus) {
    case "Stopped":
      backgroundColor = "white";
      break;
    case "Recording":
      backgroundColor = "#ff6947";
      break;
    case "Paused":
      backgroundColor = "#fffa7e";
      break;
    default:
      // Default case if recordingStatus is neither true nor false
      backgroundColor = "white";
      break;
  }

  return (
    <div className="wrapper" style={{ backgroundColor }}>
      <div className="main-margin">
        <Main
          recordingStatus={recordingStatus}
          setRecordingStatus={setRecordingStatus}
        ></Main>
      </div>
    </div>
  );
};
