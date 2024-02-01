import { Button, Tab, Tabs } from "@blueprintjs/core";
import React, { useRef, useState, useEffect } from "react";

import { Record, Stop, Pause } from "@blueprintjs/icons";
import humanizeDuration from "humanize-duration";
import { CaptureTime, millisecondsUntilDate } from "../Utils/SolarTimeUtil";
import { OutputSpec, RecordingMode, Location, RecordingStatus } from "../Types";

interface SolarRecordingStatsProps {
  mode: RecordingMode;
  framesCaptured: number;
  outputFPS: number;
  timelapseInterval: number;
  outputDuration: number;
  outputSpec: OutputSpec;
  captureQueue: CaptureTime[];
  location: Location;
  recordingStatus: RecordingStatus;
  statusMessages: { [key: string]: string };
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
      <div key={counter}>
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
        <b>{"Next Frame" + (captures.length > 1 ? "s:" : ":")} </b>
        <div>{captures}</div>
      </div>
      <div>
        <b>Location:</b>
        <div>
          {props.location.latitude}, {props.location.longitude}
        </div>
      </div>
    </div>
  );
}
