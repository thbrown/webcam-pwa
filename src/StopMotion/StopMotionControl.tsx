import { Button, Spinner, Tab, Tabs, useHotkeys } from "@blueprintjs/core";
import React, { useRef, useState, useEffect, useMemo } from "react";

import { Record, Stop, Flash } from "@blueprintjs/icons";
import { RecordingStatus } from "../Types";

interface StopMotionControlProps {
  recordingStatus: RecordingStatus;
  onStart: () => void;
  onSnapshot: () => void;
  onStop: () => void;
}

export function StopMotionControl(props: StopMotionControlProps): JSX.Element {
  const hotkeys = useMemo(
    () => [
      {
        combo: "space",
        global: true,
        label: "Start",
        onKeyDown:
          props.recordingStatus === "Paused" ? props.onStart : props.onSnapshot,
      },
    ],
    [props.onStart, props.onSnapshot, props.recordingStatus]
  );

  const { handleKeyDown, handleKeyUp } = useHotkeys(hotkeys);
  if (props.recordingStatus === "Paused") {
    return (
      <div className="footer" style={{ display: "flex" }}>
        <Button
          className={"big-button simple-label"}
          icon={<Flash />}
          large={true}
          fill={true}
          onClick={props.onSnapshot}
          style={{ paddingRight: "2px" }}
        >
          Take Frame
        </Button>
        <Button
          className={"big-button simple-label"}
          icon={<Stop />}
          large={true}
          fill={true}
          onClick={props.onStop}
          style={{ paddingLeft: "2px" }}
        >
          Stop
        </Button>
      </div>
    );
  } else if (props.recordingStatus === "Stopped") {
    return (
      <div className="footer">
        <Button
          className={"big-button simple-label"}
          icon={<Record />}
          large={true}
          fill={true}
          onClick={props.onStart}
        >
          Start Recording Stop Motion
        </Button>
      </div>
    );
  } else if (props.recordingStatus === "Recording") {
    return (
      <div className="footer" style={{ display: "flex" }}>
        <Spinner size={16} />
      </div>
    );
  }
}
