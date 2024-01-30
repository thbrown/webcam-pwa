import { Button, Dialog, Tab, Tabs } from "@blueprintjs/core";
import React, { useState, useEffect } from "react";
import { RecordingsPanel } from "./RecordingsPanel";
import { FolderOpen, Camera, Import } from "@blueprintjs/icons";
import "./Main.scss";
import { RecordingStatus } from "./App";
import {
  SavedVideoMetadata,
  getAllSavedVideosMetadata,
  getVideoElement,
} from "./VideoStorageUtils";
import { CameraPanel } from "./CameraPanel";
import { InfoDialog } from "./InfoDialog";

export type MainPanel = "camera" | "recordings" | "app";

interface MainProps {
  recordingStatus: RecordingStatus;
  setRecordingStatus: (v: RecordingStatus) => void;
  initializing: boolean;
  setInitializing: (value: boolean) => void;
}

export function Main(props: MainProps): JSX.Element {
  const [mainPanel, setMainPanel] = useState<MainPanel>("camera");
  const [savedVideos, setSavedVideos] = useState<
    SavedVideoMetadata[] | undefined
  >(undefined);
  const [videoToShow, setVideoToShow] = useState<Blob | undefined>(undefined);
  const [infoDialogContent, setInfoDialogContent] =
    useState<React.ReactNode>(undefined);

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installedApps, setInstalledApps] = useState(null);

  useEffect(() => {
    reloadSavedVideos();
  }, []);

  useEffect(() => {
    const toRun = async () => {
      if ("getInstalledRelatedApps" in navigator) {
        const relatedApps = await navigator.getInstalledRelatedApps();
        setInstalledApps(relatedApps);
      } else {
        setInstalledApps([]);
      }
    };
    toRun();
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: {
      preventDefault: () => void;
    }) => {
      event.preventDefault();
      console.log("Deferring PWA install prompt");
      setDeferredPrompt(event);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Clean up
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  // Function to trigger the install prompt manually
  const handleInstallClick = () => {
    if (deferredPrompt) {
      // Show the browser's install prompt
      deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
        if (choiceResult.outcome === "accepted") {
          console.log("User accepted the install prompt");

          // TODO: I think we need to resize the videoElement here
          setTimeout(() => {
            console.log("INSTALLED!");
          }, 1000);
        } else {
          console.log("User dismissed the install prompt");
        }

        // Reset the deferredPrompt variable
        setDeferredPrompt(null);
      });
    }
  };

  const handleShowVideoClose = () => {
    setVideoToShow(undefined);
  };

  const reloadSavedVideos = async (): Promise<SavedVideoMetadata[]> => {
    const allSavedVideoMetadata = await getAllSavedVideosMetadata();
    setSavedVideos(allSavedVideoMetadata);
    return allSavedVideoMetadata;
  };

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
              setInfoDialogContent={setInfoDialogContent}
              initializing={props.initializing}
              setInitializing={props.setInitializing}
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
        {deferredPrompt === null ? null : (
          <Tab
            className="no-highlight minimal-top-margin"
            id="app"
            title={<div className="spacer">App</div>}
            panel={
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  backgroundColor: "rgb(224, 237, 255)",
                }}
              >
                <div style={{ padding: "20px", textAlign: "center" }}>
                  timel.app is available as a PWA for installation on your
                  device.
                </div>
                <div style={{ padding: "20px", textAlign: "center" }}>
                  <img
                    style={{ border: "black solid 3px", borderRadius: "14px" }}
                    width="64"
                    height="64"
                    src="favicon.svg"
                  ></img>
                </div>
                <div style={{ padding: "20px", textAlign: "center" }}>
                  <Button onClick={handleInstallClick} title="Camera Selection">
                    Install
                  </Button>
                </div>
              </div>
            }
            icon={<Import />}
          />
        )}
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
          {getVideoElement(videoToShow, {
            maxHeight: "82vh",
            backgroundColor: "black",
          })}
        </Dialog>
      ) : null}
      <InfoDialog
        content={infoDialogContent}
        setContent={setInfoDialogContent}
      />
    </>
  );
}
