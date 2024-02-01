import React, { useEffect, useState } from "react";
import { Main } from "./Main";
import { HotkeysProvider } from "@blueprintjs/core";

import "./App.scss";
import { setSetting } from "./SettingsStorageUtils";

export type RecordingStatus = "Stopped" | "Recording" | "Paused";

export const App: React.FC = () => {
  const [recordingStatus, setRecordingStatus] =
    useState<RecordingStatus>("Stopped");
  const [initializing, setInitializing] = useState<boolean>(true);
  const [screenWidth, setScreenWidth] = useState(
    window.innerWidth ||
      document.documentElement.clientWidth ||
      document.body.clientWidth
  );

  const handleResize = () => {
    setScreenWidth(
      window.innerWidth ||
        document.documentElement.clientWidth ||
        document.body.clientWidth
    );
  };

  // Screen width state
  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Persist select fields on change
  useEffect(() => {
    if (!initializing) {
      const storeRecordingMode = async () => {
        await setSetting("recordingStatus", recordingStatus);
      };
      storeRecordingMode();
    }
  }, [recordingStatus]);

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
      backgroundColor = "white";
      break;
  }
  try {
    return (
      <HotkeysProvider>
        <div className="wrapper">
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
              initializing={initializing}
              setInitializing={setInitializing}
              screenWidth={screenWidth}
            ></Main>
          </div>
        </div>
      </HotkeysProvider>
    );
  } catch (e) {
    console.error(e);
    alert("Top level error" + e + " - " + e.stack);
  }
};
