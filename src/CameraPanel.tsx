import { Button, Dialog, Spinner, Tab, TabId, Tabs } from "@blueprintjs/core";
import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import tsWhammy from "ts-whammy/src/libs";
import { Time, Stopwatch, Clean } from "@blueprintjs/icons";
import { TimelapseParameters } from "./TimelapseParameters";
import { Control } from "./Control";
import { RecordingStatus } from "./App";
import localforage from "localforage";
import {
  SavedVideoMetadata,
  compileVideo,
  getVideoBlob,
  getVideoElement,
  saveVideo,
} from "./VideoStorageUtils";
import { RecordingStats } from "./RecordingStats";

export type RecordingMode = "Timelapse" | "StopMotion" | "Astronomical";
export type OutputSpec = "FPS" | "Duration";

interface CameraPanelProps {
  recordingStatus: RecordingStatus;
  setRecordingStatus: (v: RecordingStatus) => void;
  reloadSavedVideos: () => void;
  setVideoToShow: (video: Blob) => void;
}

export function CameraPanel(props: CameraPanelProps): JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoPlaceholderRef = useRef<HTMLDivElement>(null);
  const [recordingMode, setRecordingMode] =
    useState<RecordingMode>("Timelapse");
  const [capturedFrames, setCapturedFrames] = useState<string[]>([]);
  const [cameraPermission, setCameraPermission] = useState<
    PermissionState | undefined
  >(undefined);
  const [savingVideo, setSavingVideo] = useState<boolean>(false);

  // Timelapse Mode
  const [outputDuration, setOutputDuration] = useState<number>(1000);
  const [outputSpec, setOutputSpec] = useState<OutputSpec>("FPS");
  const [timeLapseInterval, setTimeLapseInterval] = useState<number>(1000);
  const [outputFPS, setOutputFPS] = useState<number>(30);

  useEffect(() => {
    const checkCameraPermission = async () => {
      try {
        navigator.permissions
          .query({ name: "camera" } as any)
          .then((permissionObj) => {
            console.log("Set camera permission", permissionObj.state);
            setCameraPermission(permissionObj.state);
          })
          .catch((error) => {
            console.log("Got error :", error);
          })
          .finally(() => {
            resizeVideo();
          });
      } catch (error) {
        // Permission denied or error occurred
        // TODO: Does FF end up here? Because it can't check perms for "camera"?
        setCameraPermission("denied");
      }
    };

    // Check if camera permission has already been granted
    checkCameraPermission();
  }, []);

  // Use useRef to store the interval ID so it persists across renders
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  // Access webcam stream
  const startVideo = (): void => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          console.log("START VIDEO");
          videoRef.current.srcObject = stream;
          setCameraPermission("granted");
        } else {
          console.error("No video ref!");
        }
      })
      .catch((err) => {
        console.warn("Could not access webcam ", err);
        if (err.message === "Permission denied") {
          setCameraPermission("denied");
        } else if (err.message === "Permission dismissed") {
          setCameraPermission("prompt");
        } else {
          setCameraPermission(undefined);
        }
      })
      .finally(() => resizeVideo());
  };

  // Draw video frame to canvas
  const captureFrame = (): void => {
    if (canvasRef.current && videoRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        context.drawImage(
          videoRef.current,
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );
        const frame = canvasRef.current.toDataURL("image/webp");
        setCapturedFrames((prevFrames) => {
          const newFrames = [...prevFrames, frame];
          console.log("Capturing frame!", newFrames.length); // Log the number of frames captured
          return newFrames;
        });
      }
    }
  };

  // Start time-lapse recording
  const startTimelapse = (): void => {
    if (
      props.recordingStatus === "Stopped" ||
      props.recordingStatus === "Paused"
    ) {
      props.setRecordingStatus("Recording");
      captureFrame();
      // Store the interval ID in the ref
      intervalIdRef.current = setInterval(captureFrame, timeLapseInterval);
      console.log("Start recording!!", intervalIdRef.current);
    }
  };

  // Stop time-lapse recording
  const stopTimelapse = () => {
    if (props.recordingStatus) {
      console.log("Stop recording!!", intervalIdRef.current);
      setSavingVideo(true); // TODO: show loading overlay
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null; // Clear the stored interval ID
      }
      props.setRecordingStatus("Stopped");

      // Wait for the last frames to be captured before compiling the video
      setTimeout(async () => {
        console.log(
          "Number of frames before compiling:",
          capturedFrames.length
        );
        const calculatedFPS =
          outputSpec === "FPS"
            ? outputFPS
            : (capturedFrames.length / outputDuration) * 1000;
        const videoBlob = await compileVideo(capturedFrames, calculatedFPS);
        await saveVideo(
          videoBlob.blob,
          videoBlob.previewImage,
          recordingMode,
          props.reloadSavedVideos
        );
        props.setVideoToShow(videoBlob.blob);
        setCapturedFrames([]);
        setSavingVideo(false);
      }, timeLapseInterval + 100); // Wait slightly longer than the capture interval
    }
  };

  // Pause time-lapse recording
  const pauseTimelapse = (): void => {
    // TODO: how should we handle pause restarts? Take a frame immediately? Store the paused time time?
    if (props.recordingStatus !== "Recording") {
      return;
    }
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null; // Clear the stored interval ID
    }
    props.setRecordingStatus("Paused");
  };

  const resizeVideo = () => {
    if (videoRef.current) {
      console.log(
        "VIDEO RESIZE - video",
        videoRef.current.offsetWidth,
        videoRef.current.width
      );

      videoRef.current.style.height = `${
        videoRef.current.offsetWidth / 2.031
      }px`;
    }

    if (videoPlaceholderRef.current) {
      console.log(
        "VIDEO RESIZE - div",
        videoPlaceholderRef.current.offsetWidth
      );

      videoPlaceholderRef.current.style.height = `${
        videoPlaceholderRef.current.offsetWidth / 2.031
      }px`;
    }
  };

  const setLoadingAndStartVideo = () => {
    setCameraPermission(undefined);
    startVideo();
  };

  useEffect(() => {
    return () => {
      clearInterval(intervalIdRef.current); // Clear interval on unmount
    };
  }, []);

  useEffect(() => {
    // Initial resize
    resizeVideo();

    const handleResize = () => {
      resizeVideo();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const cameraOverlay = useMemo(() => {
    console.log("Computing overlay for", cameraPermission);
    switch (cameraPermission) {
      case "prompt":
        return (
          <div
            ref={videoPlaceholderRef}
            style={{
              backgroundColor: "orange",
            }}
            className="video-placeholder"
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  marginBottom: "5px",
                }}
              >
                This app requires access to your camera to function.
              </div>
              <Button onClick={setLoadingAndStartVideo}>
                Grant Camera Permission
              </Button>
            </div>
          </div>
        );
      case "granted":
        startVideo();
        return undefined;
      case "denied":
        return (
          <div
            ref={videoPlaceholderRef}
            style={{
              backgroundColor: "grey",
            }}
            className="video-placeholder"
          >
            Camera permissions have been denied, however this app requires
            camera permission to function!
          </div>
        );
      case undefined:
        // Show spinner
        return (
          <div
            ref={videoPlaceholderRef}
            style={{
              backgroundColor: "LightGray",
            }}
            className="video-placeholder"
          >
            <Spinner size={64} />
          </div>
        );
    }
  }, [cameraPermission]);

  function handelRecordModeChange(targetPanel: RecordingMode): void {
    setRecordingMode(targetPanel);
  }

  return (
    <div className="Main">
      <div>
        {cameraOverlay}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{
            display: cameraPermission === "granted" ? "inline" : "none",
            width: "100%",
            padding: "3px",
            backgroundColor: "black",
          }}
        />
      </div>
      <canvas
        ref={canvasRef}
        style={{ display: "none" }}
        width="640"
        height="480"
      />

      <Tabs
        fill={true}
        large={true}
        onChange={handelRecordModeChange}
        selectedTabId={recordingMode}
      >
        <Tab
          className="no-highlight minimal-top-margin"
          id="Timelapse"
          title={<div className="spacer">Timelapse</div>}
          panel={
            props.recordingStatus === "Recording" ||
            props.recordingStatus === "Paused" ? (
              <RecordingStats
                mode={recordingMode}
                framesCaptured={capturedFrames.length}
                outputFPS={outputFPS}
                outputSpec={outputSpec}
                outputDuration={outputDuration}
                timeLapseInterval={timeLapseInterval}
              />
            ) : (
              <TimelapseParameters
                timeLapseInterval={timeLapseInterval}
                outputFPS={outputFPS}
                outputDuration={outputDuration}
                outputSpec={outputSpec}
                setTimeLapseInterval={setTimeLapseInterval}
                setOutputFPS={setOutputFPS}
                setOutputDuration={setOutputDuration}
                setOutputSpec={setOutputSpec}
              />
            )
          }
          icon={<Time />}
        />
        <Tab
          className="no-highlight minimal-top-margin"
          id="StopMotion"
          title={<div className="spacer">Stop Motion</div>}
          panel={<div>STOP MOTION - NOT IMPLEMENTED</div>}
          icon={<Stopwatch />}
        />
        <Tab
          className="no-highlight minimal-top-margin"
          id="Astronomical"
          title={<div className="spacer">Astronomical</div>}
          panel={<div>ASTRONOMICAL - NOT IMPLEMENTED</div>}
          icon={<Clean />}
          // https://gml.noaa.gov/grad/solcalc/table.php?lat=39.74&lon=-104.99&year=2024
        />
      </Tabs>

      {cameraPermission === "granted" ? (
        <Control
          onStart={startTimelapse}
          onStop={stopTimelapse}
          onPause={pauseTimelapse}
          recordingStatus={props.recordingStatus}
        />
      ) : null}

      <div id="timelapsePlaybackContainer"></div>
      <div id="downloadLink"></div>
    </div>
  );
}
// https://gml.noaa.gov/grad/solcalc/table.php?lat=39.74&lon=-104.99&year=2024
