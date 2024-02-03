import { Button, Dialog, Tab, Tabs } from "@blueprintjs/core";
import React, { useState, useEffect } from "react";
import { SavedVideosPanel } from "./SavePanels/SavedVideosPanel";
import { SavedImagesPanel } from "./SavePanels/SavedImagesPanel";
import { FolderOpen, Camera, Import, Film, Media } from "@blueprintjs/icons";
import "./Main.scss";
import {
  getAllSavedImageMetadata,
  getAllSavedVideosMetadata,
  getVideoElement,
} from "./Utils/VideoStorageUtils";
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
  const [imagesToShow, setImagesToShow] = useState<CapturedFrame[]>(undefined);

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installedApps, setInstalledApps] = useState(null);

  const [cameraSettings, setCameraSettings] = useState<MediaTrackSettings>({});
  const [recordingMode, setRecordingMode] =
    useState<RecordingMode>("Timelapse");
  const [capturedFrames, setCapturedFrames] = useState<CapturedFrame[]>([]);

  const [currentIndex, setCurrentIndex] = useState(0);

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

  const handleShowImagesClose = () => {
    setCurrentIndex(0);
    setImagesToShow(undefined);
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

  const handleBackwardClick = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleForwardClick = () => {
    if (currentIndex < imagesToShow.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
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
              setImagesToShow={setImagesToShow}
              setCameraSettings={setCameraSettings}
              setRecordingMode={setRecordingMode}
              setCapturedFrames={setCapturedFrames}
              setRecordingStatus={props.setRecordingStatus}
              setMainPanel={setMainPanel}
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
      {imagesToShow !== undefined ? (
        <Dialog
          title="Saved Images"
          isOpen={true}
          isCloseButtonShown={true}
          onClose={handleShowImagesClose}
          style={{ width: "90vw" }}
          icon={<FolderOpen />}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
            }}
            className="parent"
          >
            <Button
              className={"overlay-button"}
              style={{
                bottom: "10px",
                left: "10px",
                opacity: ".7",
                height: "48px",
                width: "48px",
              }}
              onClick={handleBackwardClick}
              disabled={currentIndex === 0}
            >
              {"<<"}
            </Button>

            <img
              src={imagesToShow[currentIndex].image}
              alt={`Image ${currentIndex + 1}`}
              style={{ maxWidth: "100%", maxHeight: "80vh", margin: "0 auto" }}
            />

            <div
              className={"overlay-button"}
              style={{
                top: "10px",
                left: "50%",
                transform: "translateX(-50%)",
                opacity: ".7",
                padding: "10px",
                backgroundColor: "black",
                borderRadius: "3px",
                color: "white",
              }}
            >
              {imagesToShow[0].type.mode}
            </div>

            <div
              className={"overlay-button"}
              style={{
                bottom: "10px",
                left: "50%",
                transform: "translateX(-50%)",
                opacity: ".7",
                padding: "10px",
                backgroundColor: "black",
                borderRadius: "3px",
                color: "white",
              }}
            >
              {currentIndex + 1 + " of " + imagesToShow.length}
            </div>

            <Button
              className={"overlay-button"}
              style={{
                bottom: "10px",
                right: "10px",
                opacity: ".7",
                height: "48px",
                width: "48px",
              }}
              onClick={handleForwardClick}
              disabled={currentIndex === imagesToShow.length - 1}
            >
              {">>"}
            </Button>
          </div>
        </Dialog>
      ) : null}
      <InfoDialog
        content={infoDialogContent}
        setContent={setInfoDialogContent}
      />
    </>
  );
}
