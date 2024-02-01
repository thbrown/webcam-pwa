import React from "react";

import humanizeDuration from "humanize-duration";
import { OutputSpec, RecordingMode, RecordingStatus } from "../Types";

interface TimelapseRecordingStatsProps {
  mode: RecordingMode;
  framesCaptured: number;
  outputFPS: number;
  timelapseInterval: number;
  outputDuration: number;
  outputSpec: OutputSpec;
  recordingStatus: RecordingStatus;
  statusMessages: { [key: string]: string };
}

// TODO: Show progress in save loading? We might need to web-worker whammy in order to make this happen.
// TODO: Pause the recording if we don't get the exact same resolution when the camera restarts
// TODO: Sort recordings?
// TODO: Show some animation about how to install on ios
// TODO: lock screen? does this already work?
// TODO: save default camera values?
// TODO: Show speed up x in status?
// TODO: Test solar timelapse
// TODO: broken video stream after installing app

export function TimelapseRecordingStats(
  props: TimelapseRecordingStatsProps
): JSX.Element {
  return (
    <div style={{ padding: "10px" }}>
      {Object.keys(props.statusMessages).length !== 0 ? (
        <div>
          <b>Status Message: </b>
          {Object.values(props.statusMessages).join(", ")}
        </div>
      ) : null}
      <div>
        <b>Status:</b> {props.recordingStatus}
      </div>
      <div>
        <b>Mode:</b> {props.mode}
      </div>
      <div>
        <b>Frames Captured:</b> {props.framesCaptured}
      </div>
      {props.outputSpec === "FPS" ? (
        <div>
          <b>Video Duration:</b>{" "}
          {humanizeDuration((props.framesCaptured / props.outputFPS) * 1000, {
            round: true,
          })}
        </div>
      ) : (
        <div>
          <b>Video FPS:</b>{" "}
          {Math.round((props.framesCaptured / props.outputDuration) * 1000)}
        </div>
      )}
      <div>
        <b>Elapsed Time:</b>{" "}
        {humanizeDuration(props.framesCaptured * props.timelapseInterval, {
          round: true,
        })}
      </div>
    </div>
  );
}
