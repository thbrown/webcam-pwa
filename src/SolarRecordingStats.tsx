import { Button, Tab, Tabs } from "@blueprintjs/core";
import React, { useRef, useState, useEffect } from "react";

import { Record, Stop, Pause } from "@blueprintjs/icons";
import { RecordingStatus } from "./App";
import { OutputSpec, RecordingMode } from "./CameraPanel";
import humanizeDuration from "humanize-duration";
import { CaptureTime, millisecondsUntilDate } from "./SolarTimeUtil";

interface SolarRecordingStatsProps {
  mode: RecordingMode;
  framesCaptured: number;
  outputFPS: number;
  timeLapseInterval: number;
  outputDuration: number;
  outputSpec: OutputSpec;
  captureQueue: CaptureTime[];
}

export function SolarRecordingStats(
  props: SolarRecordingStatsProps
): JSX.Element {
  const [time, setTime] = useState<number>(new Date().getTime());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTime(new Date().getTime());
    }, 1000);

    // Clear the interval when the component is unmounted
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const captures = [];
  let counter = 0;
  for (let cap of props.captureQueue) {
    counter++;
    if (counter > 5) {
      break;
    }
    captures.push(
      <div>
        {cap.type}
        {" in "}
        <i>
          {humanizeDuration(millisecondsUntilDate(cap.time, time), {
            round: true,
          })}
        </i>
      </div>
    );
  }
  return (
    <div style={{ padding: "10px" }}>
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
        <b>Next Frames:</b>
        <div>{captures}</div>
      </div>
    </div>
  );
}
