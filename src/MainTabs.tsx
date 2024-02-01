import { Button, Dialog, Tab, Tabs } from "@blueprintjs/core";
import React, { useState, useEffect } from "react";
import { SavedVideosPanel } from "./SavedVideosPanel";
import { SavedImagesPanel } from "./SavedImagesPanel";
import { FolderOpen, Camera, Import, Film, Media } from "@blueprintjs/icons";
import "./Main.scss";
import {
  getAllSavedImageMetadata,
  getAllSavedVideosMetadata,
  getVideoElement,
} from "./VideoStorageUtils";
import {
  SaveImageMetadata,
  SavedVideoMetadata,
  RecordingStatus,
  MainPanel,
  RecordingMode,
  CapturedFrame,
} from "./Types";
import { CameraPanel } from "./CameraPanel";
import { InfoDialog } from "./InfoDialog";

interface MainProps {
  recordingStatus: RecordingStatus;
  setRecordingStatus: (v: RecordingStatus) => void;
  initializing: boolean;
  setInitializing: (value: boolean) => void;
  screenWidth: number;
}

export function Main(props: MainProps): JSX.Element {
  const [mainPanel, setMainPanel] = useState<MainPanel>("camera");
  const [savedVideos, setSavedVideos] = useState<
    SavedVideoMetadata[] | undefined
  >(undefined);
  const [savedImages, setSavedImages] = useState<
    SaveImageMetadata[] | undefined
  >(undefined);
  const [videoToShow, setVideoToShow] = useState<Blob | undefined>(undefined);
  const [infoDialogContent, setInfoDialogContent] =
    useState<React.ReactNode>(undefined);
  const [tabStyle, setTabStyle] = useState<string>(null);

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installedApps, setInstalledApps] = useState(null);

  // Hoist
  const [cameraSettings, setCameraSettings] = useState<MediaTrackSettings>({});
  const [recordingMode, setRecordingMode] =
    useState<RecordingMode>("Timelapse");
  const [capturedFrames, setCapturedFrames] = useState<CapturedFrame[]>([]);

  useEffect(() => {
    reloadSavedMedia();
  }, []);

  /*
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
  */

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

  const reloadSavedMedia = async (): Promise<SavedVideoMetadata[]> => {
    const allSavedVideoMetadata = await getAllSavedVideosMetadata();
    setSavedVideos(allSavedVideoMetadata);
    const allSavedImageMetadata = await getAllSavedImageMetadata();
    setSavedImages(allSavedImageMetadata);
    return allSavedVideoMetadata;
  };

  const handleTabChange = (targetPanel: MainPanel) => {
    setMainPanel(targetPanel);
  };

  const getTabClass = (element: MainPanel) => {
    const term = props.screenWidth < 410 && mainPanel !== element ? "gone" : "";
    return `spacer ${term}`;
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
          title={<div className={getTabClass("camera")}>Camera</div>}
          panel={
            <CameraPanel
              recordingStatus={props.recordingStatus}
              setRecordingStatus={props.setRecordingStatus}
              reloadSavedMedia={reloadSavedMedia}
              setVideoToShow={setVideoToShow}
              setInfoDialogContent={setInfoDialogContent}
              initializing={props.initializing}
              setInitializing={props.setInitializing}
              cameraSettings={cameraSettings}
              setCameraSettings={setCameraSettings}
              recordingMode={recordingMode}
              setRecordingMode={setRecordingMode}
              capturedFrames={capturedFrames}
              setCapturedFrames={setCapturedFrames}
            />
          }
          icon={<Camera />}
        />
        <Tab
          className="no-highlight minimal-top-margin"
          id="videos"
          title={<div className={getTabClass("videos")}>Videos</div>}
          panel={
            <SavedVideosPanel
              savedVideos={savedVideos}
              reloadSavedMedia={reloadSavedMedia}
              setVideoToShow={setVideoToShow}
            />
          }
          icon={<Film />}
          tagContent={
            savedVideos === undefined ? undefined : savedVideos.length
          }
        />
        <Tab
          className="no-highlight minimal-top-margin"
          id="images"
          title={<div className={getTabClass("images")}>Images</div>}
          panel={
            <SavedImagesPanel
              savedImages={savedImages}
              reloadSavedMedia={reloadSavedMedia}
              setVideoToShow={setVideoToShow}
            />
          }
          icon={<Media />}
          tagContent={
            savedImages === undefined ? undefined : savedImages.length
          }
        />
        {deferredPrompt === null ? null : (
          <Tab
            className="no-highlight minimal-top-margin"
            id="app"
            title={<div className={getTabClass("app")}>App</div>}
            panel={
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  backgroundColor: "rgb(224, 237, 255)",
                }}
              >
                <div style={{ padding: "20px", textAlign: "center" }}>
                  timel.app is available for installation on your device.
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
