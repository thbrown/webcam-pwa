import { Button, Spinner, Tab, Tabs } from "@blueprintjs/core";
import React, { useRef, useState, useEffect, useMemo } from "react";
import { Time, Stopwatch, Clean, Camera } from "@blueprintjs/icons";
import { RecordingStatus } from "./App";
import { compileVideo, saveVideo } from "./VideoStorageUtils";
import { TimelapseRecordingStats } from "./TimelapseRecordingStats";
import { StopMotionRecordingStats } from "./StopMotionRecordingStats";
import { TimelapseControl } from "./TimelapseControl";
import { StopMotionControl } from "./StopMotionControl";
import { AstronomicalControl } from "./AstronomicalControl";
import { AdvancedCameraOptions } from "./AdvancedCameraOptions";
import { TimelapseParameters } from "./TimelapseParameters";
import { StopMotionParameters } from "./StopMotionParameters";
import { AstronomicalParameters } from "./AstronomicalParameters";
import { CaptureTime, getTimes, millisecondsUntilDate } from "./SolarTimeUtil";
import { AstronomicalRecordingStats } from "./AstronomicalRecordingStats";

export type RecordingMode = "Timelapse" | "StopMotion" | "Astronomical";
export type OutputSpec = "FPS" | "Duration";

interface CameraPanelProps {
  recordingStatus: RecordingStatus;
  setRecordingStatus: (v: RecordingStatus) => void;
  reloadSavedVideos: () => void;
  setVideoToShow: (video: Blob) => void;
}

export type CameraSettings = {
  [key: string]: string | number;
};

export type CameraCapabilities = {
  [key: string]:
    | {
        max: number;
        min: number;
        step?: number;
      }
    | string[]
    | string;
};

export function CameraPanel(props: CameraPanelProps): JSX.Element {
  // Common state
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
  const [supportedCameraCapabilities, setSupportedCameraCapabilities] =
    useState<CameraCapabilities | undefined>(undefined);
  const [cameraSettings, setCameraSettings] = useState<
    CameraSettings | undefined
  >(undefined);

  const [activeTrack, setActiveTrack] = useState<MediaStreamTrack>(undefined);

  const [outputSpec, setOutputSpec] = useState<OutputSpec>("FPS");
  const [outputDuration, setOutputDuration] = useState<number>(1000);
  const [outputFPS, setOutputFPS] = useState<number>(30);

  // Timelapse State
  const [timeLapseInterval, setTimeLapseInterval] = useState<number>(1000);

  // Astronomical State
  const [captureTimes, setCaptureTimes] = useState<string[]>([]);
  const [location, setLocation] = useState<{
    longitude: number;
    latitude: number;
  }>({
    longitude: -104.991531,
    latitude: 39.742043,
  });
  const [captureQueue, setCaptureQueue] = useState<CaptureTime[]>([]);

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

    // https://codepen.io/rijuB/pen/eKwLXB
    //const supports = navigator.mediaDevices.getSupportedConstraints();
    //console.log("supports = ", JSON.parse(JSON.stringify(supports)));

    function sleep(ms = 0) {
      return new Promise((r) => setTimeout(r, ms));
    }

    // Check if camera permission has already been granted
    checkCameraPermission();
  }, []);

  // Use useRef to store the interval ID so it persists across renders
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  // Access webcam stream
  const startVideo = (): void => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((mediaStream) => {
        if (videoRef.current) {
          console.log("START VIDEO");
          videoRef.current.srcObject = mediaStream;

          const tracks = mediaStream.getVideoTracks();
          const track = tracks[tracks.length - 1];
          setActiveTrack(track);

          const capabilities = track.getCapabilities();
          console.log(
            "capabilities == ",
            JSON.parse(JSON.stringify(capabilities))
          );
          setSupportedCameraCapabilities(capabilities as CameraCapabilities);

          const settings = track.getSettings();
          setCameraSettings(settings as CameraSettings);
          console.log("settings == ", JSON.parse(JSON.stringify(settings)));
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
  const captureFrame = async (): Promise<void> => {
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

  const captureStopMotionFrame = async (): Promise<void> => {
    props.setRecordingStatus("Recording");
    await captureFrame();
    setTimeout(() => {
      props.setRecordingStatus("Paused");
    }, 100); // TODO: this might be annoying, remove?
  };

  // Start time-lapse recording
  const scheduleAstronomicalTimelapse = async (): Promise<void> => {
    props.setRecordingStatus("Recording");
    const times = getTimes(location.latitude, location.longitude);
    const filteredTimes = times.filter((v) => captureTimes.includes(v.type));
    setCaptureQueue(filteredTimes);
    const nextCapture = millisecondsUntilDate(times[0].time);
    console.log("Nex capture ", nextCapture, times[0].type);
    intervalIdRef.current = setTimeout(captureAstronomicalFrame, nextCapture);
    console.log("Start recording!!", intervalIdRef.current);
  };

  // Take frame and keep going
  const captureAstronomicalFrame = async (): Promise<void> => {
    await captureFrame();
    await scheduleAstronomicalTimelapse();
  };

  // Start time-lapse recording
  const startTimelapse = async (): Promise<void> => {
    if (
      props.recordingStatus === "Stopped" ||
      props.recordingStatus === "Paused"
    ) {
      props.setRecordingStatus("Recording");
      await captureFrame();
      // Store the interval ID in the ref
      intervalIdRef.current = setInterval(captureFrame, timeLapseInterval);
      console.log("Start recording!!", intervalIdRef.current);
    }
  };

  // Stop time-lapse recording
  const stopAndSave = () => {
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
        if (capturedFrames.length > 0) {
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
        } else {
          alert("No frames were captured!");
        }

        setCapturedFrames([]);
        setSavingVideo(false);
      }, /*timeLapseInterval +*/ 100); // Wait slightly longer than the capture interval (I don't think this is necessary?)
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
            <div className="video-placeholder">
              <div
                style={{
                  marginBottom: "5px",
                }}
              >
                This app requires access to your camera to function.
              </div>
              <Button onClick={setLoadingAndStartVideo} icon={<Camera />}>
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
            <div className="video-placeholder">
              Camera permissions have been denied, however this app requires
              camera permission to function!
            </div>
            <img
              style={{ marginTop: "10px", width: "35vw", maxWidth: "400px" }}
              src="cameraPerms.gif"
            />
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

  const getControls = () => {
    switch (recordingMode) {
      case "StopMotion":
        return (
          <StopMotionControl
            recordingStatus={props.recordingStatus}
            onStart={captureStopMotionFrame}
            onSnapshot={captureStopMotionFrame}
            onStop={stopAndSave}
          />
        );
      case "Timelapse":
        return (
          <TimelapseControl
            recordingStatus={props.recordingStatus}
            onStart={startTimelapse}
            onStop={stopAndSave}
            onPause={pauseTimelapse}
          />
        );
      default:
        return (
          <AstronomicalControl
            recordingStatus={props.recordingStatus}
            onStart={scheduleAstronomicalTimelapse}
            onStop={stopAndSave}
          />
        );
    }
  };

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
      {savingVideo ? (
        <div>
          <div style={{ padding: "20px", textAlign: "center" }}>
            <b>Saving Video...</b>
          </div>
          <Spinner size={64} />
        </div>
      ) : (
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
                <TimelapseRecordingStats
                  mode={recordingMode}
                  framesCaptured={capturedFrames.length}
                  outputFPS={outputFPS}
                  outputSpec={outputSpec}
                  outputDuration={outputDuration}
                  timeLapseInterval={timeLapseInterval}
                />
              ) : (
                <div>
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
                  <AdvancedCameraOptions
                    setCameraSettings={setCameraSettings}
                    cameraPermission={cameraPermission}
                    cameraSettings={cameraSettings}
                    activeTrack={activeTrack}
                    supportedCameraCapabilities={supportedCameraCapabilities}
                  />
                </div>
              )
            }
            icon={<Time />}
            disabled={
              props.recordingStatus === "Recording" ||
              props.recordingStatus === "Paused"
            }
          />
          <Tab
            className="no-highlight minimal-top-margin"
            id="StopMotion"
            title={<div className="spacer">Stop Motion</div>}
            panel={
              <>
                {props.recordingStatus === "Recording" ||
                props.recordingStatus === "Paused" ? (
                  <StopMotionRecordingStats
                    mode={recordingMode}
                    framesCaptured={capturedFrames.length}
                    outputFPS={outputFPS}
                    outputSpec={outputSpec}
                    outputDuration={outputDuration}
                    timeLapseInterval={timeLapseInterval}
                  />
                ) : null}
                <div>
                  <StopMotionParameters
                    outputFPS={outputFPS}
                    outputDuration={outputDuration}
                    outputSpec={outputSpec}
                    setOutputFPS={setOutputFPS}
                    setOutputDuration={setOutputDuration}
                    setOutputSpec={setOutputSpec}
                  />
                  <AdvancedCameraOptions
                    setCameraSettings={setCameraSettings}
                    cameraPermission={cameraPermission}
                    cameraSettings={cameraSettings}
                    activeTrack={activeTrack}
                    supportedCameraCapabilities={supportedCameraCapabilities}
                  />
                </div>
              </>
            }
            icon={<Stopwatch />}
            disabled={
              props.recordingStatus === "Recording" ||
              props.recordingStatus === "Paused"
            }
          />
          <Tab
            className="no-highlight minimal-top-margin"
            id="Astronomical"
            title={<div className="spacer">Astronomical</div>}
            panel={
              <>
                {props.recordingStatus === "Recording" ? (
                  <AstronomicalRecordingStats
                    mode={recordingMode}
                    framesCaptured={capturedFrames.length}
                    outputFPS={outputFPS}
                    outputSpec={outputSpec}
                    outputDuration={outputDuration}
                    timeLapseInterval={timeLapseInterval}
                    captureQueue={captureQueue}
                  />
                ) : null}
                <div>
                  <AstronomicalParameters
                    location={location}
                    captureTimes={captureTimes}
                    setLocation={setLocation}
                    setCaptureTimes={setCaptureTimes}
                    outputFPS={outputFPS}
                    outputDuration={outputDuration}
                    outputSpec={outputSpec}
                    setOutputFPS={setOutputFPS}
                    setOutputDuration={setOutputDuration}
                    setOutputSpec={setOutputSpec}
                  />
                  <AdvancedCameraOptions
                    setCameraSettings={setCameraSettings}
                    cameraPermission={cameraPermission}
                    cameraSettings={cameraSettings}
                    activeTrack={activeTrack}
                    supportedCameraCapabilities={supportedCameraCapabilities}
                  />
                </div>
              </>
            }
            icon={<Clean />}
            disabled={
              props.recordingStatus === "Recording" ||
              props.recordingStatus === "Paused"
            }
            // https://gml.noaa.gov/grad/solcalc/table.php?lat=39.74&lon=-104.99&year=2024
          />
        </Tabs>
      )}
      {cameraPermission === "granted" && !savingVideo ? getControls() : null}
    </div>
  );
}
