import React, { useState } from "react";
import { Main } from "./Main";
import { HotkeysProvider } from "@blueprintjs/core";

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
  try {
    return (
      <HotkeysProvider>
        <div className="wrapper">
          14
          <div
            style={{
              position: "fixed",
              top: "0",
              left: "0",
              width: "100%",
              height: "100vh",
              backgroundColor,
              zIndex: "-1",
            }}
          ></div>
          <div className="main-margin">
            <Main
              recordingStatus={recordingStatus}
              setRecordingStatus={setRecordingStatus}
            ></Main>
          </div>
        </div>
      </HotkeysProvider>
    );
  } catch (e) {
    console.log(e);
    alert("Top level error" + e + " - " + e.stack);
  }
};
