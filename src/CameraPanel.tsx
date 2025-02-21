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
  Tooltip,
} from "@blueprintjs/core";
import React, {
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import {
  Time,
  Stopwatch,
  Camera,
  MobileVideo,
  Flash,
  Refresh,
} from "@blueprintjs/icons";
import {
  compileVideo,
  resizeBase64Image,
  savePictures,
  saveVideo,
} from "./Utils/VideoStorageUtils";
import { TimelapseRecordingStats } from "./Timelapse/TimelapseRecordingStats";
import { StopMotionRecordingStats } from "./StopMotion/StopMotionRecordingStats";
import { TimelapseControl } from "./Timelapse/TimelapseControl";
import { StopMotionControl } from "./StopMotion/StopMotionControl";
import { SolarControl } from "./Solar/SolarControl";
import { CameraSettings } from "./CameraSettings";
import { TimelapseParameters } from "./Timelapse/TimelapseParameters";
import { StopMotionParameters } from "./StopMotion/StopMotionParameters";
import { SolarParameters } from "./Solar/SolarParameters";
import {
  CaptureTime,
  getTimes,
  millisecondsUntilDate,
} from "./Utils/SolarTimeUtil";
import { SolarRecordingStats } from "./Solar/SolarRecordingStats";
import {
  setSetting,
  getSetting,
  getSavedFrames,
  saveFrame,
  clearFrames,
  updateSetting,
  groupedSettings,
} from "./Utils/SettingsStorageUtils";
import { debounce } from "lodash";
import {
  CameraStatus,
  OutputSpec,
  RecordingStatus,
  Location,
  CapturedFrame,
  RecordingMode,
} from "./Types";
import { assertNever } from "./Utils/GenericUtils";

interface CameraPanelProps {
  recordingStatus: RecordingStatus;
  setRecordingStatus: (v: RecordingStatus) => void;
  reloadSavedMedia: () => void;
  setVideoToShow: (video: Blob) => void;
  setInfoDialogContent: (value: React.ReactNode) => void;
  initializing: boolean;
  setInitializing: (value: boolean) => void;
  cameraSettings: MediaTrackSettings;
  setCameraSettings: (value: MediaTrackSettings) => void;
  recordingMode: RecordingMode;
  setRecordingMode: (value: RecordingMode) => void;
  capturedFrames: CapturedFrame[];
  setCapturedFrames: (
    value: CapturedFrame[] | ((prevFrames: CapturedFrame[]) => CapturedFrame[])
  ) => void;
}

export function CameraPanel(props: CameraPanelProps): JSX.Element {
  // Common state
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoPlaceholderRef = useRef<HTMLDivElement>(null);
  const [cameraPermission, setCameraPermission] = useState<
    PermissionState | undefined
  >(undefined);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("idle");
  const [savingVideo, setSavingVideo] = useState<boolean>(false);
  const [videoSaveMessage, setVideoSaveMessage] = useState<string>("Init");
  const [supportedCameraCapabilities, setSupportedCameraCapabilities] =
    useState<MediaTrackCapabilities | undefined>(undefined);
  const [cameraSettingsLoading, setCameraSettingsLoading] = useState<string[]>(
    []
  );
  const [statusMessages, setStatusMessages] = useState<{
    [key: string]: string;
  }>({});
  const [screenOrientation, setScreenOrientation] = useState<
    "portrait" | "landscape"
  >();

  const [isCameraSelectDialogOpen, setIsCameraSelectDialogOpen] =
    useState<boolean>(false);

  const [activeTrack, setActiveTrack] = useState<MediaStreamTrack>(undefined);
  const [availableCameras, setAvailableCameras] =
    useState<MediaDeviceInfo[]>(undefined);

  const [outputSpec, setOutputSpec] = useState<OutputSpec>("FPS");
  const [outputDuration, setOutputDuration] = useState<number>(1000);
  const [outputFPS, setOutputFPS] = useState<number>(30);
  const [enableSavePictures, setEnableSavePictures] = useState<boolean>(true);

  // Timelapse State
  const [timelapseInterval, setTimelapseInterval] = useState<number>(1000);

  // Solar State
  const [captureTimes, setCaptureTimes] = useState<string[]>([]);
  const [location, setLocation] = useState<Location>({
    // Denver default
    longitude: -104.991531,
    latitude: 39.742043,
  });
  const [captureQueue, setCaptureQueue] = useState<CaptureTime[]>([]);

  useEffect(() => {
    screen.orientation.addEventListener("change", (event: any) => {
      const type: string = event.target.type;
      const angle: number = event.target.angle;
      console.log(`ScreenOrientation change: ${type}, ${angle} degrees.`);
      if (type.includes("portrait")) {
        setScreenOrientation("portrait");
      } else if (type.includes("landscape")) {
        setScreenOrientation("landscape");
      }
    });

    if (window.matchMedia("(orientation: portrait)").matches) {
      setScreenOrientation("portrait");
    } else if (window.matchMedia("(orientation: landscape)").matches) {
      setScreenOrientation("landscape");
    }
  }, []);

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
          setIsCameraInitializing();
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

  const usePersistOnChange = (value: any, key: string) => {
    useEffect(() => {
      if (!props.initializing) {
        const intermediate = async () => {
          await setSetting(key, value);
        };
        intermediate();
      }
    }, [value]);
  };

  usePersistOnChange(props.recordingMode, "recordingMode");
  usePersistOnChange(location, "location");
  usePersistOnChange(captureTimes, "captureTimes");
  usePersistOnChange(timelapseInterval, "timelapseInterval");
  usePersistOnChange(props.cameraSettings, "cameraSettings");
  usePersistOnChange(enableSavePictures, "enableSavePictures");

  // Special case the frame re-loading (save frames one at a time for perf reasons)
  useEffect(() => {
    if (!props.initializing) {
      const intermediate = async () => {
        if (props.capturedFrames.length === 0) {
          await clearFrames();
        } else {
          await saveFrame(
            props.capturedFrames[props.capturedFrames.length - 1],
            props.capturedFrames.length - 1
          );
        }
      };
      intermediate();
    }
  }, [props.capturedFrames]);

  // Load saved fields from localforage, if any
  useEffect(() => {
    const storeStateCameraPanel = async () => {
      if (cameraStatus !== "initialized") return;

      console.log(
        "Camera initialized! Loading additional saved state (if available)"
      );

      await updateSetting("recordingMode", props.setRecordingMode);
      await updateSetting("recordingStatus", props.setRecordingStatus);
      await updateSetting("timelapseInterval", setTimelapseInterval);
      await updateSetting("location", setLocation);
      await updateSetting("captureTimes", setCaptureTimes);
      await updateSetting("enableSavePictures", setEnableSavePictures);

      const frames = await getSavedFrames();
      if (frames !== undefined) props.setCapturedFrames(frames);

      props.setInitializing(false);
    };

    storeStateCameraPanel();
  }, [cameraStatus]);

  // As part of initialization, if we are in recording mode we need to start taking frames
  useEffect(() => {
    if (props.recordingStatus !== "Recording") {
      return;
    }
    console.log("Status was 'Recording' resuming...", props.recordingMode);

    switch (props.recordingMode) {
      case "Timelapse":
        startTimelapse();
        break;
      case "StopMotion":
        props.setRecordingStatus("Paused");
        break;
      case "Solar":
        scheduleSolarTimelapse();
        break;
      default:
        assertNever(props.recordingMode);
    }
  }, [props.initializing]);

  // Use useRef to store the interval ID so it persists across renders
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const lastFrameTimestamp = useRef<number | null>(null);
  const framesCapturedInSession = useRef<number | null>(null);

  const removeObjectProperty = <T, K extends keyof T>(
    obj: T,
    property: K
  ): Omit<T, K> => {
    const { [property]: removedProperty, ...rest } = obj;
    return rest;
  };

  // Access webcam stream
  const startVideo = async (): Promise<void> => {
    // Get camera based of of previous camera settings (or any camera if not available)
    const constraints: MediaStreamConstraints =
      props.cameraSettings === undefined
        ? { video: true }
        : {
            video: {
              advanced: [
                {
                  deviceId: props.cameraSettings.deviceId,
                },
              ],
            },
          };

    try {
      console.log("Getting camera ", props.cameraSettings.deviceId);
      const mediaStream = await navigator.mediaDevices.getUserMedia(
        constraints
      );

      if (videoRef.current) {
        console.log("START VIDEO", videoRef.current);
        videoRef.current.srcObject = mediaStream;

        const tracks = mediaStream.getVideoTracks();
        console.log(
          "Got camera with settings: ",
          tracks,
          tracks[0].getSettings()
        );

        const track = tracks[0];
        setActiveTrack(track);

        const constraintsWithoutDeviceId = removeObjectProperty(
          props.cameraSettings,
          "deviceId"
        );
        console.log(
          "Applying constraints from settings",
          constraintsWithoutDeviceId
        );

        const patch: MediaTrackConstraints = {
          advanced: [constraintsWithoutDeviceId as MediaTrackConstraintSet],
        };

        // Never set device id here - it causes re-initialization
        delete patch.deviceId;
        await applySettingsChanges(patch, track);

        // Get a list of all available video inputs (only once)
        if (availableCameras === undefined) {
          const allDevices = await navigator.mediaDevices.enumerateDevices();
          const availableCameras = [];

          for (let i = 0; i !== allDevices.length; ++i) {
            const deviceInfo = allDevices[i];
            if (deviceInfo.kind === "videoinput") {
              console.log("Available camera: ", deviceInfo);
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
          console.warn("Camera capabilities are not supported in this browser");
          setSupportedCameraCapabilities({} as MediaTrackCapabilities);
        }

        // TODO: Idk if this copy is necessary
        const settings = JSON.parse(JSON.stringify(track.getSettings()));
        props.setCameraSettings(settings);
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
    if (props.recordingMode === "Solar") {
      return {
        image,
        type: { mode: props.recordingMode, solarEvent: captureQueue[0].type },
      };
    } else {
      return { image, type: { mode: props.recordingMode } };
    }
  };

  // Draw video frame to canvas
  const captureFrame = async (
    captureQueue?: CaptureTime[] // Just used for solar capture
  ): Promise<CapturedFrame> => {
    // Detect slow recording (if more than 10% too slow)
    framesCapturedInSession.current =
      (framesCapturedInSession.current ?? 0) + 1;
    if (props.recordingMode === "Timelapse") {
      if (
        lastFrameTimestamp.current &&
        Date.now() - lastFrameTimestamp.current >
          timelapseInterval + timelapseInterval * 0.15 &&
        framesCapturedInSession.current > 2 // Might take a couple frames to reach steady state
      ) {
        console.warn(
          "Slow frame detected",
          lastFrameTimestamp.current,
          Date.now() - lastFrameTimestamp.current,
          timelapseInterval + timelapseInterval * 0.1,
          framesCapturedInSession.current
        );
        setStatusMessages({
          ...statusMessages,
          slow: "WARNING - this device's hardware isn't powerful enough to capture frames at the set rate! Frames will be captured a the fastest rate possible for your selected settings.",
        });
      } else {
        const copy = { ...statusMessages };
        delete copy.slow;
        setStatusMessages(copy);
      }
      lastFrameTimestamp.current = Date.now();
    }

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

        // const frameImageData = canvasRef.current.toDataURL("image/webp");
        const frameImageData = await new Promise<string>((resolve) => {
          canvasRef.current.toBlob((blob) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          }, "image/webp");
        });

        const newFrame = getCapturedFrameObject(frameImageData, captureQueue);
        props.setCapturedFrames((prevFrames) => {
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
    // Set timeout for button perf
    setTimeout(async () => {
      await captureFrame();
      setTimeout(() => {
        props.setRecordingStatus("Paused");
      }, 100);
    }, 1);
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
    props.setRecordingStatus("Recording");

    // captureFrame can take a while for larger resolutions, setTimeout to make the start button more responsive
    setTimeout(async () => {
      await captureFrame();
      // Store the interval ID in the ref
      console.log("starting with timelapse interval", timelapseInterval);
      intervalIdRef.current = setInterval(captureFrame, timelapseInterval);
    }, 1);

    console.log("Start recording!!", intervalIdRef.current);
  };

  const discardFrames = async (): Promise<void> => {
    props.setRecordingStatus("Stopped");
    framesCapturedInSession.current = 0;
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    props.setCapturedFrames([]);
  };

  const solarCapturesComparator = (
    captureA: CapturedFrame,
    captureB: CapturedFrame
  ) => {
    // We don't support mixed capture frames now so not sure what his behavior should be if we did
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
      setSavingVideo(true);

      framesCapturedInSession.current = 0;
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null; // Clear the stored interval ID
      }
      props.setRecordingStatus("Stopped");

      let processedCaptures = props.capturedFrames;
      if (props.recordingMode === "Solar") {
        processedCaptures = props.capturedFrames.sort(solarCapturesComparator);
        console.log("Sorted captures", processedCaptures);
      }

      // Wait for the last frames to be captured before compiling the video
      setTimeout(async () => {
        try {
          console.log(
            "Number of frames before compiling:",
            processedCaptures.length,
            processedCaptures
          );
          if (processedCaptures.length > 0) {
            // Save images first (is case there is some issue with compiling the video)
            if (enableSavePictures) {
              await savePictures(
                processedCaptures,
                await resizeBase64Image(processedCaptures[0].image, 50, 41),
                props.reloadSavedMedia,
                props.cameraSettings.width,
                props.cameraSettings.height
              );
            }

            const calculatedFPS =
              outputSpec === "FPS"
                ? outputFPS
                : (processedCaptures.length / outputDuration) * 1000;
            const videoBlob = await compileVideo(
              processedCaptures.map((v) => v.image),
              calculatedFPS,
              setVideoSaveMessage,
              "ffmpeg"
            );
            if (videoBlob != null) {
              await saveVideo(
                videoBlob.blob,
                videoBlob.previewImage,
                props.recordingMode,
                props.reloadSavedMedia,
                props.cameraSettings.width,
                props.cameraSettings.height
              );
              props.setVideoToShow(videoBlob.blob);
            }
          } else {
            props.setInfoDialogContent(<div>No frames were captured!</div>);
          }
        } catch (e) {
          console.error("Error saving video", e);
          alert(e);
        } finally {
          props.setCapturedFrames([]);
          setSavingVideo(false);
          setVideoSaveMessage("Init");
        }
      }, 100);
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
    framesCapturedInSession.current = 0;
    props.setRecordingStatus("Paused");
  };

  const applySettingsChanges = useCallback(
    async (
      constraints: MediaTrackConstraints,
      inputActiveTrack?: MediaStreamTrack
    ) => {
      // Call this before debounce to maintain better ui responsiveness
      props.setCameraSettings({
        ...props.cameraSettings,
        ...(constraints.advanced[0] as MediaTrackSettings),
      });
      return new Promise<void>((resolve) => {
        applySettingsChangesInner(constraints, inputActiveTrack, () => {
          resolve(null);
        });
      });
    },
    [activeTrack, props.cameraSettings]
  );

  const applySettingsChangesInner = useCallback(
    debounce(
      async (
        constraints: MediaTrackConstraints,
        inputActiveTrack: MediaStreamTrack,
        callback: () => void
      ) => {
        console.log("Applying camera settings", constraints.advanced[0]);

        const track = inputActiveTrack ?? activeTrack;
        setCameraSettingsLoading(Object.keys(constraints)); // TODO: we probably want to make sure this isn't called concurrently somehow

        // Switching cameras requires a whole different media track
        if (constraints.advanced[0].deviceId !== undefined) {
          // Remove
          console.log("DeviceId has been changed");
          setIsCameraInitializing(); // TODO in init we just need to apply settings
          return;
        }

        if (constraints.advanced.length !== 1) {
          throw new Error(
            "This method only supports a single element in the advanced array"
          );
        }

        try {
          const allConstraints = Object.keys(
            constraints.advanced[0]
          ) as (keyof MediaTrackConstraintSet)[];

          // Apply the constraints one at a time (otherwise we will get an overconstrained error about mixing video and photo constraints)
          const singularPatches = {} as {
            [key in keyof MediaTrackConstraintSet]: MediaTrackConstraintSet;
          };
          const groupPatches = {} as {
            [key in string]: MediaTrackConstraintSet;
          };

          for (let constraint of allConstraints) {
            if (["groupId"].includes(constraint)) {
              continue;
            }

            // Build the patch
            const targetValue = constraints.advanced[0][constraint];
            const patch = {};
            //@ts-ignore
            patch[constraint] = targetValue;

            // Check if this setting belongs to a known group
            const group = groupedSettings.findIndex((group) =>
              group.includes(constraint)
            );

            // Remember the patch
            if (group === -1) {
              // This setting gets applied by itself
              singularPatches[constraint] = patch;
            } else {
              const groupKey = new String(group) as string;
              // This setting gets applied with other settings in its group (if specified)
              if (groupPatches[groupKey] === undefined) {
                groupPatches[groupKey] = patch;
              } else {
                groupPatches[groupKey] = {
                  ...groupPatches[groupKey],
                  ...patch,
                };
              }
            }
          }

          // Apply singular patches
          for (let patchIndex of Object.keys(singularPatches)) {
            const patch =
              singularPatches[patchIndex as keyof MediaTrackConstraintSet];
            await track.applyConstraints(patch);

            const targetKey = Object.keys(
              patch
            )[0] as keyof MediaTrackConstraintSet;
            const targetValue = patch[targetKey];

            if (track.getSettings()[targetKey] !== targetValue) {
              console.warn(
                "Failed to apply",
                targetKey,
                targetValue,
                "value is",
                track.getSettings()[targetKey]
              );
            } else {
              console.log(
                "Successfully applied",
                targetKey,
                targetValue,
                "value is",
                track.getSettings()[targetKey]
              );
            }
          }

          // Apply group patches
          // TODO: can we still apply a value for sliders in continuous mode without issues?
          const sortedKeys = Object.keys(groupPatches).sort(
            (a, b) => parseInt(a) - parseInt(b)
          );
          for (let patchIndex of sortedKeys) {
            const patch = groupPatches[patchIndex];
            await track.applyConstraints(patch);

            const keysInPatch = Object.keys(patch);
            for (let keyInPatch of keysInPatch) {
              const targetKey = keyInPatch as keyof MediaTrackConstraintSet;
              const targetValue = patch[targetKey];

              // TODO: aspect ratio comparisons should have some tolerance

              if (track.getSettings()[targetKey] !== targetValue) {
                console.warn(
                  "Failed to apply (group settings)",
                  targetKey,
                  targetValue,
                  "value is",
                  track.getSettings()[targetKey]
                );
                // Re-apply width/height/aspectRatio changes, these are really important
                if (targetKey === "width" || targetKey === "height") {
                  delete patch.aspectRatio;
                  console.log(
                    `Re-applying ${targetKey} constraints without aspect ratio`,
                    patch
                  );
                  await track.applyConstraints(patch);
                }
              } else {
                console.log(
                  "Successfully applied (group settings)",
                  targetKey,
                  targetValue,
                  "value is",
                  track.getSettings()[targetKey]
                );
              }
            }
          }
          console.log("Camera setting application complete");
          props.setCameraSettings(track.getSettings());
        } catch (e) {
          console.error(e);
          alert("ERROR applying settings " + e);
        } finally {
          setCameraSettingsLoading([]);
          callback();
        }
      },
      100
    ),
    [activeTrack]
  );

  const resizeVideo = () => {
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
  };

  const setIsCameraInitializing = async () => {
    // We need to load settings before we get the camera so we know what camera to get
    await updateSetting("cameraSettings", props.setCameraSettings);
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
              <Button onClick={setIsCameraInitializing} icon={<Camera />}>
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
    props.setRecordingMode(targetPanel);
  }

  const getControls = () => {
    switch (props.recordingMode) {
      case "StopMotion":
        return (
          <StopMotionControl
            recordingStatus={props.recordingStatus}
            onStart={captureStopMotionFrame}
            onSnapshot={captureStopMotionFrame}
            onStop={stopAndSave}
            onDiscard={discardFrames}
          />
        );
      case "Timelapse":
        return (
          <TimelapseControl
            recordingStatus={props.recordingStatus}
            onStart={startTimelapse}
            onStop={stopAndSave}
            onPause={pauseTimelapse}
            onDiscard={discardFrames}
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
              onChange={async (v: React.ChangeEvent<HTMLInputElement>) => {
                console.log("Selected a camera", v.target.value);
                const patch: MediaTrackConstraintSet = {
                  deviceId: v.target.value,
                };
                const constraints: MediaTrackConstraints = {
                  advanced: [patch],
                };
                await applySettingsChanges(constraints);
              }}
              selectedValue={props.cameraSettings.deviceId}
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
          <div
            className={"overlay-button"}
            style={{
              top: "10px",
              right: "10px",
              opacity: ".8",
            }}
          >
            <Tooltip content="Select camera">
              <Button
                large={true}
                icon={<MobileVideo />}
                onClick={() => {
                  setIsCameraSelectDialogOpen(true);
                }}
              ></Button>
            </Tooltip>
          </div>
        ) : null}

        {cameraStatus === "initialized"
          ? /*(
            This looks too much like a camera swap button
          <div
            className={"overlay-button"}
            style={{
              bottom: "10px",
              left: "10px",
            }}
          >
            <Tooltip content="Refresh camera">
              <Button
                large={true}
                icon={<Refresh />}
                onClick={() => {
                  window.location.reload();
                }}
              ></Button>
            </Tooltip>
          </div>
              ) : null */ null
          : null}
        {cameraStatus === "initialized" && !savingVideo ? getControls() : null}
        {activeTrack !== undefined ? (
          <div
            style={{
              position: "absolute",
              top: "10px",
              left: "10px",
              zIndex: "1",
              color: "white",
              background: "rgba(0,0,0,.5)",
              borderRadius: "3px",
              paddingRight: "5px",
              paddingLeft: "5px",
            }}
          >
            {cameraSettingsLoading.length === 0 ? (
              screenOrientation === "portrait" ? (
                (props.cameraSettings.height ?? "?") +
                " x " +
                (props.cameraSettings.width ?? "?") +
                " (portrait)"
              ) : (
                (props.cameraSettings.width ?? "?") +
                " x " +
                (props.cameraSettings.height ?? "?")
              )
            ) : (
              <Spinner size={16} />
            )}
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
            maxHeight: "50vh",
            minHeight: "160px",
          }}
        />
      </div>
      <canvas
        ref={canvasRef}
        style={{ display: "none" }}
        width={videoRef.current ? videoRef.current.videoWidth : "100"}
        height={
          videoRef.current ? videoRef.current.videoHeight : "100" // TODO: this ya be zero before init, is that okay?
        }
      />
      {savingVideo ? (
        <div>
          <div style={{ padding: "20px", textAlign: "center" }}>
            <b>Saving Video...</b>
            <br></br>
            <div>{videoSaveMessage}</div>
          </div>
          <Spinner size={64} />
        </div>
      ) : (
        <div>
          <Tabs
            fill={true}
            large={true}
            onChange={handelRecordModeChange}
            selectedTabId={props.recordingMode}
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
                      mode={props.recordingMode}
                      framesCaptured={props.capturedFrames.length}
                      outputFPS={outputFPS}
                      outputSpec={outputSpec}
                      outputDuration={outputDuration}
                      timelapseInterval={timelapseInterval}
                      recordingStatus={props.recordingStatus}
                      statusMessages={statusMessages}
                    />
                  ) : null}
                  <div>
                    <TimelapseParameters
                      timelapseInterval={timelapseInterval}
                      outputFPS={outputFPS}
                      outputDuration={outputDuration}
                      outputSpec={outputSpec}
                      setTimelapseInterval={setTimelapseInterval}
                      setOutputFPS={setOutputFPS}
                      setOutputDuration={setOutputDuration}
                      setOutputSpec={setOutputSpec}
                      recordingStatus={props.recordingStatus}
                      enableSavePictures={enableSavePictures}
                      setEnableSavePictures={setEnableSavePictures}
                    />
                    <CameraSettings
                      setCameraSettings={props.setCameraSettings}
                      cameraStatus={cameraStatus}
                      cameraSettings={props.cameraSettings}
                      activeTrack={activeTrack}
                      supportedCameraCapabilities={supportedCameraCapabilities}
                      recordingStatus={props.recordingStatus}
                      cameraSettingsLoading={cameraSettingsLoading}
                      setCameraSettingsLoading={setCameraSettingsLoading}
                      applySettingsChanges={applySettingsChanges}
                      screenOrientation={screenOrientation}
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
                      mode={props.recordingMode}
                      framesCaptured={props.capturedFrames.length}
                      outputFPS={outputFPS}
                      outputSpec={outputSpec}
                      outputDuration={outputDuration}
                      timelapseInterval={timelapseInterval}
                      recordingStatus={props.recordingStatus}
                      statusMessages={statusMessages}
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
                      enableSavePictures={enableSavePictures}
                      setEnableSavePictures={setEnableSavePictures}
                    />
                    <CameraSettings
                      setCameraSettings={props.setCameraSettings}
                      cameraStatus={cameraStatus}
                      cameraSettings={props.cameraSettings}
                      activeTrack={activeTrack}
                      supportedCameraCapabilities={supportedCameraCapabilities}
                      recordingStatus={props.recordingStatus}
                      cameraSettingsLoading={cameraSettingsLoading}
                      setCameraSettingsLoading={setCameraSettingsLoading}
                      applySettingsChanges={applySettingsChanges}
                      screenOrientation={screenOrientation}
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
                      mode={props.recordingMode}
                      framesCaptured={props.capturedFrames.length}
                      outputFPS={outputFPS}
                      outputSpec={outputSpec}
                      outputDuration={outputDuration}
                      timelapseInterval={timelapseInterval}
                      captureQueue={captureQueue}
                      location={location}
                      recordingStatus={props.recordingStatus}
                      statusMessages={statusMessages}
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
                      enableSavePictures={enableSavePictures}
                      setEnableSavePictures={setEnableSavePictures}
                    />
                    <CameraSettings
                      setCameraSettings={props.setCameraSettings}
                      cameraStatus={cameraStatus}
                      cameraSettings={props.cameraSettings}
                      activeTrack={activeTrack}
                      supportedCameraCapabilities={supportedCameraCapabilities}
                      recordingStatus={props.recordingStatus}
                      cameraSettingsLoading={cameraSettingsLoading}
                      setCameraSettingsLoading={setCameraSettingsLoading}
                      applySettingsChanges={applySettingsChanges}
                      screenOrientation={screenOrientation}
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
        </div>
      )}
    </div>
  );
}
