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
