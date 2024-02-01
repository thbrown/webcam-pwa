export type MainPanel = "camera" | "videos" | "images" | "app";

export type RecordingStatus = "Stopped" | "Recording" | "Paused";

export type RecordingMode = "Timelapse" | "StopMotion" | "Solar";

export type OutputSpec = "FPS" | "Duration";

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

export type CompiledVideo = {
  blob: Blob;
  previewImage: string;
};

export type SavedVideoMetadata = {
  type: RecordingMode;
  timestamp: number;
  size: number;
  saveUuid: string;
  previewImage: string;
  width: number;
  height: number;
};

export type SaveImageMetadata = {
  timestamp: number;
  size: number;
  saveUuid: string;
  previewImage: string;
  width: number;
  height: number;
};
