import { Button, Spinner, Tab, Tabs } from "@blueprintjs/core";
import React, { useRef, useState, useEffect } from "react";

import { Record, Stop, Flash } from "@blueprintjs/icons";
import { RecordingStatus } from "./App";

interface StopMotionControlProps {
  recordingStatus: RecordingStatus;
  onStart: () => void;
  onSnapshot: () => void;
  onStop: () => void;
}

export function StopMotionControl(props: StopMotionControlProps): JSX.Element {
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
          Start Stop Motion
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
