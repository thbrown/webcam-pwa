import {
  Button,
  Dialog,
  DialogBody,
  DialogFooter,
  Radio,
  RadioGroup,
  Spinner,
  Tab,
  Tabs,
} from "@blueprintjs/core";
import React, { useRef, useState, useEffect, useMemo } from "react";
import {
  Time,
  Stopwatch,
  Clean,
  Camera,
  MobileVideo,
  Flash,
} from "@blueprintjs/icons";
import { RecordingStatus } from "./App";
import { compileVideo, saveVideo } from "./VideoStorageUtils";
import { TimelapseRecordingStats } from "./TimelapseRecordingStats";
import { StopMotionRecordingStats } from "./StopMotionRecordingStats";
import { TimelapseControl } from "./TimelapseControl";
import { StopMotionControl } from "./StopMotionControl";
import { SolarControl } from "./SolarControl";
import { CameraSettings } from "./CameraSettings";
import { TimelapseParameters } from "./TimelapseParameters";
import { StopMotionParameters } from "./StopMotionParameters";
import { SolarParameters } from "./SolarParameters";
import { CaptureTime, getTimes, millisecondsUntilDate } from "./SolarTimeUtil";
import { SolarRecordingStats } from "./SolarRecordingStats";
import localforage from "localforage";

export type RecordingMode = "Timelapse" | "StopMotion" | "Solar";
export type OutputSpec = "FPS" | "Duration";

interface CameraPanelProps {
  recordingStatus: RecordingStatus;
  setRecordingStatus: (v: RecordingStatus) => void;
  reloadSavedVideos: () => void;
  setVideoToShow: (video: Blob) => void;
  setInfoDialogContent: (value: React.ReactNode) => void;
}

export type CapturedFrame = {
  image: string;
  type: CaptureType;
};

export type CaptureType = TimelapseCapture | StopMotionCapture | SolarCapture;

export interface BaseCapture {
  mode: RecordingMode;
}

export type TimelapseCapture = BaseCapture & {
  mode: "Timelapse";
};

export type StopMotionCapture = BaseCapture & {
  mode: "StopMotion";
};

export type SolarCapture = BaseCapture & {
  mode: "Solar";
  solarEvent: string;
};

export type CameraStatus = "idle" | "initializing" | "initialized";

export type Location = {
  longitude: number;
  latitude: number;
};

export function CameraPanel(props: CameraPanelProps): JSX.Element {
  // Common state
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoPlaceholderRef = useRef<HTMLDivElement>(null);
  const [recordingMode, setRecordingMode] =
    useState<RecordingMode>("Timelapse");
  const [capturedFrames, setCapturedFrames] = useState<CapturedFrame[]>([]);
  const [cameraPermission, setCameraPermission] = useState<
    PermissionState | undefined
  >(undefined);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("idle");
  const [savingVideo, setSavingVideo] = useState<boolean>(false);
  const [supportedCameraCapabilities, setSupportedCameraCapabilities] =
    useState<MediaTrackCapabilities | undefined>(undefined);
  const [cameraSettings, setCameraSettings] = useState<MediaTrackSettings>({});

  const [isCameraSelectDialogOpen, setIsCameraSelectDialogOpen] =
    useState<boolean>(false);

  const [activeTrack, setActiveTrack] = useState<MediaStreamTrack>(undefined);
  const [activeCamera, setActiveCamera] = useState<string>(undefined);
  const [availableCameras, setAvailableCameras] =
    useState<MediaDeviceInfo[]>(undefined);

  const [outputSpec, setOutputSpec] = useState<OutputSpec>("FPS");
  const [outputDuration, setOutputDuration] = useState<number>(1000);
  const [outputFPS, setOutputFPS] = useState<number>(30);

  // Timelapse State
  const [timeLapseInterval, setTimeLapseInterval] = useState<number>(1000);

  // Solar State
  const [captureTimes, setCaptureTimes] = useState<string[]>([]);
  const [location, setLocation] = useState<Location>({
    // Denver default
    longitude: -104.991531,
    latitude: 39.742043,
  });
  const [captureQueue, setCaptureQueue] = useState<CaptureTime[]>([]);

  useEffect(() => {
    if (cameraStatus === "initializing") {
      startVideo();
    }
  }, [cameraStatus]);

  // Some browsers support permission checks, if this browser does check the status on mount
  useEffect(() => {
    const checkCameraPermission = async () => {
      try {
        const permissionObj = await navigator.permissions.query({
          name: "camera",
        } as any);
        setCameraPermission(permissionObj.state);
        if (permissionObj.state === "granted") {
          // Init process will set camera permission status to granted if successful
          setIsInitializing();
          return;
        }
        console.log("Set camera permission", permissionObj.state);
        setCameraPermission(permissionObj.state);
      } catch (error) {
        // Handle errors, set permission to "prompt" in case of failure
        console.log("Got error :", error);
        setCameraPermission("prompt");
      } finally {
        resizeVideo();
      }
    };

    // Check if camera permission has already been granted
    checkCameraPermission();
  }, []);

  // Persist select fields on change
  /*
  useEffect(() => {
    const storeStateCameraPanel = async () => {
      localforage.setItem("recordingMode", JSON.stringify(recordingMode));
      localforage.setItem("capturedFrames", JSON.stringify(capturedFrames));
    };
    storeStateCameraPanel();
  }, [capturedFrames, recordingMode]);
  */

  // Use useRef to store the interval ID so it persists across renders
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  // Access webcam stream
  const startVideo = async (): Promise<void> => {
    // Get a particular camera
    const constraints: MediaStreamConstraints =
      activeCamera === undefined
        ? { video: true }
        : {
            video: { deviceId: { ideal: activeCamera } },
          };

    try {
      console.log("Getting camera with constraints ", constraints);
      const mediaStream = await navigator.mediaDevices.getUserMedia(
        constraints
      );

      if (videoRef.current) {
        console.log("START VIDEO", videoRef.current);
        videoRef.current.srcObject = mediaStream;

        const tracks = mediaStream.getVideoTracks();
        const track = tracks[0];
        setActiveTrack(track);

        // There is something wrong here causing mismatch between the active camera and the camera actually being used
        if (activeCamera !== track.getSettings().deviceId) {
          console.log("Setting active camera 1", track.getSettings().deviceId);
          setActiveCamera(track.getSettings().deviceId);
        }

        // Get a list of all available video inputs (only once)
        if (availableCameras === undefined) {
          const allDevices = await navigator.mediaDevices.enumerateDevices();
          const availableCameras = [];

          for (let i = 0; i !== allDevices.length; ++i) {
            const deviceInfo = allDevices[i];
            if (deviceInfo.kind === "videoinput") {
              console.log("Got camera: ", deviceInfo);
              availableCameras.push(deviceInfo);
            }
          }

          setAvailableCameras(availableCameras);
        }

        // Capabilities are not supported in FF
        if (track.getCapabilities) {
          const capabilities = track.getCapabilities();
          setSupportedCameraCapabilities(capabilities);
        } else {
          console.warn("Capabilities not supported in this browser");
          setSupportedCameraCapabilities({} as MediaTrackCapabilities);
        }

        // TODO: Idk if this copy is necessary
        const settings = JSON.parse(JSON.stringify(track.getSettings()));
        setCameraSettings(settings);
        setCameraStatus("initialized");
      } else {
        console.error("No video ref!");
      }

      resizeVideo();
    } catch (err) {
      console.warn("Could not access webcam ", err);
      if (err.message === "Permission denied") {
        setCameraPermission("denied");
      } else if (err.message === "Permission dismissed") {
        setCameraPermission("prompt");
      } else {
        setCameraPermission("prompt");
      }
      setCameraStatus("idle");
    }
  };

  const getCapturedFrameObject = (
    image: string,
    captureQueue: CaptureTime[]
  ): CapturedFrame => {
    if (recordingMode === "Solar") {
      return {
        image,
        type: { mode: recordingMode, solarEvent: captureQueue[0].type },
      };
    } else {
      return { image, type: { mode: recordingMode } };
    }
  };

  // Draw video frame to canvas
  const captureFrame = async (
    captureQueue?: CaptureTime[] // Just used for solar capture
  ): Promise<CapturedFrame> => {
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
        const frameImageData = canvasRef.current.toDataURL("image/webp");

        // TODO: it's a fun idea to color resolution text based of the background, but it's hard because the video element has a letterbox usually
        // Plus this isn't really the right place for it, we want to do it even when we aren't capturing frames
        // console.log("COLOR", context.getImageData(10, 10, 1, 1).data);

        const newFrame = getCapturedFrameObject(frameImageData, captureQueue);
        setCapturedFrames((prevFrames) => {
          const newFrames = [...prevFrames, newFrame];
          console.log("Capturing frame!", newFrames.length); // Log the number of frames captured
          return newFrames;
        });
        return newFrame;
      }
    }
  };

  const captureStopMotionFrame = async (): Promise<void> => {
    props.setRecordingStatus("Recording");
    await captureFrame();
    setTimeout(() => {
      props.setRecordingStatus("Paused");
    }, 100);
  };

  useEffect(() => {
    console.log("Capture queue changed ", captureQueue);
  }, [captureQueue]);

  // Start time-lapse recording
  const scheduleSolarTimelapse = async (): Promise<CaptureTime[]> => {
    if (captureTimes.length === 0) {
      props.setInfoDialogContent(
        <div>
          In solar mode, you must select at least one solar position for which
          to capture frames, otherwise no frames will be captured!
        </div>
      );
      return;
    }
    props.setRecordingStatus("Recording");
    const times = getTimes(location.latitude, location.longitude);
    const filteredTimes = times.filter((v) => captureTimes.includes(v.type));
    setCaptureQueue(filteredTimes);
    const nextCapture = millisecondsUntilDate(filteredTimes[0].time);
    console.log(
      "Next capture in ",
      nextCapture,
      filteredTimes[0].type,
      filteredTimes
    );

    // We need to pass the updated queue here, if we try to get it from the state?
    intervalIdRef.current = setTimeout(() => {
      captureSolarFrame(filteredTimes);
    }, nextCapture);
    console.log("Start recording!!", intervalIdRef.current);
    return Promise.resolve(filteredTimes);
  };

  // Take frame and keep going
  const captureSolarFrame = async (
    captureQueue: CaptureTime[]
  ): Promise<void> => {
    await captureFrame(captureQueue);
    await scheduleSolarTimelapse();
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

  const solarCapturesComparator = (
    captureA: CapturedFrame,
    captureB: CapturedFrame
  ) => {
    // We dont support mixed capture frames now so not sute what his behavior should be if we did
    if (captureA.type.mode !== "Solar" || captureB.type.mode !== "Solar") {
      return 0;
    }

    // Compare solarEvent values
    const solarEventComparison = captureA.type.solarEvent.localeCompare(
      captureB.type.solarEvent
    );

    // If solarEvent values are the same, maintain the original order
    if (solarEventComparison === 0) {
      return 0;
    }

    // Otherwise, sort by solarEvent
    return solarEventComparison;
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

      let processedCaptures = capturedFrames;
      if (recordingMode === "Solar") {
        processedCaptures = capturedFrames.sort(solarCapturesComparator);
      }

      // Wait for the last frames to be captured before compiling the video
      setTimeout(async () => {
        console.log(
          "Number of frames before compiling:",
          processedCaptures.length
        );
        if (processedCaptures.length > 0) {
          const calculatedFPS =
            outputSpec === "FPS"
              ? outputFPS
              : (processedCaptures.length / outputDuration) * 1000;
          const videoBlob = await compileVideo(
            processedCaptures.map((v) => v.image),
            calculatedFPS
          );
          await saveVideo(
            videoBlob.blob,
            videoBlob.previewImage,
            recordingMode,
            props.reloadSavedVideos
          );
          props.setVideoToShow(videoBlob.blob);
        } else {
          props.setInfoDialogContent(<div>No frames were captured!</div>);
        }

        setCapturedFrames([]);
        setSavingVideo(false);
      }, /*timeLapseInterval +*/ 100); // Wait slightly longer than the capture interval (I don't think this is necessary?)
    }
  };

  // Pause time-lapse recording
  const pauseTimelapse = (): void => {
    // TODO: Should we handle pause restarts differently? Take a frame immediately? Store the paused time time?
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
    console.log("VIDEO RESIZE ");

    let vidHeight = 0;
    if (videoRef.current) {
      vidHeight = videoRef.current.offsetWidth / 2.031;
    }

    let overlayHeight = 0;
    if (videoPlaceholderRef.current) {
      overlayHeight = videoPlaceholderRef.current.offsetWidth / 2.031;
    }

    if (videoRef.current) {
      videoRef.current.style.height = `${Math.max(vidHeight, overlayHeight)}px`;
    }

    if (videoPlaceholderRef.current) {
      videoPlaceholderRef.current.style.height = `${Math.max(
        vidHeight,
        overlayHeight
      )}px`;
    }

    console.log(
      "VIDEO RESIZE - div",
      `${Math.max(vidHeight, overlayHeight)}px`
    );
  };

  const setIsInitializing = () => {
    setCameraStatus("initializing");
  };

  // Stop taking frames on unmount
  useEffect(() => {
    return () => {
      clearInterval(intervalIdRef.current);
    };
  }, []);

  // Video element resize on window size change
  useEffect(() => {
    resizeVideo();
    window.addEventListener("resize", resizeVideo);
    return () => {
      window.removeEventListener("resize", resizeVideo);
    };
  }, []);

  const cameraOverlay = useMemo(() => {
    console.log("Computing overlay for", cameraStatus, cameraPermission);
    if (cameraStatus === "initialized") {
      return null;
    } else if (cameraStatus === "initializing") {
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
              <Button onClick={setIsInitializing} icon={<Camera />}>
                Grant Camera Permission
              </Button>
            </div>
          </div>
        );
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
      case "granted":
        // Show spinner -  this shouldn't happen, granted should always mean initialized
        props.setInfoDialogContent(
          <div>Error on page involving Camera permissions. Try refreshing.</div>
        );
      case undefined:
        // Spinner
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
  }, [cameraPermission, cameraStatus]);

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
          <SolarControl
            recordingStatus={props.recordingStatus}
            onStart={scheduleSolarTimelapse}
            onStop={stopAndSave}
          />
        );
    }
  };

  function getCameraRadioOptions() {
    const options = [];
    let counter = 0;
    for (let availableCamera of availableCameras ?? []) {
      options.push(
        <Radio
          label={availableCamera.label}
          value={availableCamera.deviceId}
          key={availableCamera.label}
        />
      );
      counter++;
    }
    return options;
  }

  return (
    <div className="Main">
      <Dialog
        title="Select Camera"
        isOpen={isCameraSelectDialogOpen}
        onClose={() => {
          setIsCameraSelectDialogOpen(false);
        }}
      >
        <DialogBody>
          {
            <RadioGroup
              onChange={(v: React.ChangeEvent<HTMLInputElement>) => {
                console.log("Selected a camera", v.target.value);
                setActiveCamera(v.target.value);
                setIsInitializing();
              }}
              selectedValue={activeCamera}
            >
              {getCameraRadioOptions()}
            </RadioGroup>
          }
        </DialogBody>
        <DialogFooter
          actions={
            <Button
              intent="primary"
              text="Okay"
              onClick={() => {
                setIsCameraSelectDialogOpen(false);
              }}
            />
          }
        />
      </Dialog>
      <div className="parent">
        {cameraOverlay}
        {cameraStatus === "initialized" ? (
          <Button
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              zIndex: "1",
            }}
            large={true}
            icon={<MobileVideo />}
            onClick={() => {
              setIsCameraSelectDialogOpen(true);
            }}
          ></Button>
        ) : null}
        {activeTrack !== undefined ? (
          <div
            style={{
              position: "absolute",
              top: "10px",
              left: "10px",
              zIndex: "1",
              color: "white",
            }}
          >
            {activeTrack.getSettings().width} x{" "}
            {activeTrack.getSettings().height}
          </div>
        ) : null}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{
            display: cameraStatus === "initialized" ? "inline" : "none",
            width: "100%",
            padding: "3px",
            backgroundColor: "black",
            boxShadow: "0 3px 10px rgb(0 0 0 / 1)",
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
              <>
                {props.recordingStatus === "Recording" ||
                props.recordingStatus === "Paused" ? (
                  <TimelapseRecordingStats
                    mode={recordingMode}
                    framesCaptured={capturedFrames.length}
                    outputFPS={outputFPS}
                    outputSpec={outputSpec}
                    outputDuration={outputDuration}
                    timeLapseInterval={timeLapseInterval}
                    recordingStatus={props.recordingStatus}
                  />
                ) : null}
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
                    recordingStatus={props.recordingStatus}
                  />
                  <CameraSettings
                    setCameraSettings={setCameraSettings}
                    cameraStatus={cameraStatus}
                    cameraSettings={cameraSettings}
                    activeTrack={activeTrack}
                    supportedCameraCapabilities={supportedCameraCapabilities}
                  />
                </div>
              </>
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
                    recordingStatus={props.recordingStatus}
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
                    recordingStatus={props.recordingStatus}
                  />
                  <CameraSettings
                    setCameraSettings={setCameraSettings}
                    cameraStatus={cameraStatus}
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
            id="Solar"
            title={<div className="spacer">Solar</div>}
            panel={
              <>
                {props.recordingStatus === "Recording" ? (
                  <SolarRecordingStats
                    mode={recordingMode}
                    framesCaptured={capturedFrames.length}
                    outputFPS={outputFPS}
                    outputSpec={outputSpec}
                    outputDuration={outputDuration}
                    timeLapseInterval={timeLapseInterval}
                    captureQueue={captureQueue}
                    location={location}
                    recordingStatus={props.recordingStatus}
                  />
                ) : null}
                <div>
                  <SolarParameters
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
                    recordingStatus={props.recordingStatus}
                  />
                  <CameraSettings
                    setCameraSettings={setCameraSettings}
                    cameraStatus={cameraStatus}
                    cameraSettings={cameraSettings}
                    activeTrack={activeTrack}
                    supportedCameraCapabilities={supportedCameraCapabilities}
                  />
                </div>
              </>
            }
            icon={<Flash />}
            disabled={
              props.recordingStatus === "Recording" ||
              props.recordingStatus === "Paused"
            }
          />
        </Tabs>
      )}
      {cameraStatus === "initialized" && !savingVideo ? getControls() : null}
    </div>
  );
}
