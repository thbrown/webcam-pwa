import { Button, Tab, Tabs } from "@blueprintjs/core";
import React, { useRef, useState, useEffect } from "react";

import { Record, Stop, Pause } from "@blueprintjs/icons";
import { RecordingStatus } from "./App";
import { OutputSpec, RecordingMode } from "./CameraPanel";
import humanizeDuration from "humanize-duration";

interface TimelapseRecordingStatsProps {
  mode: RecordingMode;
  framesCaptured: number;
  outputFPS: number;
  timelapseInterval: number;
  outputDuration: number;
  outputSpec: OutputSpec;
  recordingStatus: RecordingStatus;
}

// TODO: Don't show app tab if the web app is already installed
// TODO: Fix input to ms per frame
// TODO: Show a status message if we can't take frames as fast as we can save them
// TODO: Show progress in save loading? We might need to web-worker whammy in order to make this happen.
// TODO: Pause the recording if we don't get the exact same resolution when the camera restarts
// TODO: Set settings to whatever comes back from when we init the camera
// TODO: Sort recordings?
// TODO: Show some animation about how to install on ios
// TODO: lock screen? does this already work?
// TODO: save default camera values?
// TODO: Show speed up x in status?
// TODO: Save pictures option
// TODO: Allow resuming video? or some kind of preview?
// TODO: Test solar timelapse
// TODO: broken video stream after installing app

export function TimelapseRecordingStats(
  props: TimelapseRecordingStatsProps
): JSX.Element {
  return (
    <div style={{ padding: "10px" }}>
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
