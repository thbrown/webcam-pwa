import { Button, Spinner, Tab, TabId, Tabs } from "@blueprintjs/core";
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

export type RecordingMode = "Timelapse" | "StopMotion" | "Astronomical";
export type OutputSpec = "FPS" | "Duration";

interface CameraPanelProps {
  recordingStatus: RecordingStatus;
  setRecordingStatus: (v: RecordingStatus) => void;
}

export function CameraPanel(props: CameraPanelProps): JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoPlaceholderRef = useRef<HTMLDivElement>(null);
  const [recordingMode, setRecordingMode] =
    useState<RecordingMode>("Timelapse");
  const [capturedFrames, setCapturedFrames] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [cameraPermission, setCameraPermission] = useState<
    PermissionState | undefined
  >(undefined);

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

  // Start time-lapse recording
  const startTimelapse = (): void => {
    if (
      props.recordingStatus === "Stopped" ||
      props.recordingStatus === "Paused"
    ) {
      if (videoUrl !== undefined) {
        cleanupResources(videoUrl);
      }
      props.setRecordingStatus("Recording");
      captureFrame();
      // Store the interval ID in the ref
      intervalIdRef.current = setInterval(captureFrame, timeLapseInterval);
      console.log("Start recording!!", intervalIdRef.current);
    }
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

  // Stop time-lapse recording
  const stopTimelapse = (): void => {
    if (props.recordingStatus) {
      console.log("Stop recording!!", intervalIdRef.current);
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null; // Clear the stored interval ID
      }
      props.setRecordingStatus("Stopped");
      // Wait for the last frames to be captured before compiling the video
      setTimeout(() => {
        console.log(
          "Number of frames before compiling:",
          capturedFrames.length
        );
        compileTimelapseVideo();
      }, timeLapseInterval + 100); // Wait slightly longer than the capture interval
    }
  };

  // Pause time-lapse recording
  const pauseTimelapse = (): void => {
    if (props.recordingStatus === "Recording") {
      props.setRecordingStatus("Paused");
    }
    console.warn("PAUSE NOT IMPLEMENTED");
  };

  // Compile frames into a video
  const compileTimelapseVideo = (): void => {
    const videoBlob = framesToVideo(capturedFrames);
    const videoUrl = URL.createObjectURL(videoBlob);
    const videoElement = document.createElement("video");
    videoElement.src = videoUrl;
    videoElement.controls = true;
    videoElement.autoplay = true;
    setVideoUrl(videoUrl);

    const playbackContainer = document.getElementById(
      "timelapsePlaybackContainer"
    );
    const downloadLinkContainer = document.getElementById("downloadLink");
    if (playbackContainer) {
      playbackContainer.innerHTML = "";
      playbackContainer.appendChild(videoElement);

      // Provide download link for the video
      const downloadLink = document.createElement("a");
      downloadLink.href = videoUrl;
      downloadLink.download = "timelapse.webm";
      downloadLink.textContent = "Download Timelapse Video";
      downloadLinkContainer.appendChild(downloadLink);
    }
  };

  function uint8ArrayToBlob(
    uint8Array: Uint8Array,
    mimeType = "application/octet-stream"
  ) {
    // Create a new Blob from the Uint8Array
    return new Blob([uint8Array], { type: mimeType });
  }

  // Convert captured frames to a video blob
  const framesToVideo = (frames: string[]): Blob => {
    //const webmBlob = tsWhammy.fromImageArray(frames, 1000 / timeLapseInterval);
    const webmBlob = tsWhammy.fromImageArray(frames, outputFPS);
    console.log("BLOB IS", webmBlob);
    if (webmBlob instanceof Uint8Array) {
      console.log(
        "webm output is Uint8Array converting... not sure if this is correct"
      );
      return uint8ArrayToBlob(webmBlob);
    }
    return webmBlob;
  };

  // Cleanup resources after compiling the video
  const cleanupResources = (videoUrl: string): void => {
    console.log("Clean up resources");

    // Revoke the object URL to free up memory
    URL.revokeObjectURL(videoUrl);

    // Clear the captured frames
    setCapturedFrames([]);

    // Stop the video stream
    /*
    if (videoRef.current && videoRef.current.srcObject) {
      const mediaStream = videoRef.current.srcObject as MediaStream;
      mediaStream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    */
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
    console.log("Tab change", targetPanel);
    setRecordingMode(targetPanel);
  }

  return (
    <div className="WebcamTimelapse">
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
          }
          icon={<Time />}
        />
        <Tab
          className="no-highlight minimal-top-margin"
          id="StopMotion"
          title={<div className="spacer">Stop Motion</div>}
          panel={<div>STOP MOTION</div>}
          icon={<Stopwatch />}
        />
        <Tab
          className="no-highlight minimal-top-margin"
          id="Astronomical"
          title={<div className="spacer">Astronomical</div>}
          panel={<div>ASTRONOMICAL</div>}
          icon={<Clean />}
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
