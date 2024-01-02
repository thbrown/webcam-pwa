import { Button, Tab, Tabs } from "@blueprintjs/core";
import React, { useRef, useState, useEffect } from "react";

import { Record, Stop, Pause } from "@blueprintjs/icons";
import { RecordingStatus } from "./App";

interface ControlProps {
  recordingStatus: RecordingStatus;
  onStop: () => void;
  onPause: () => void;
  onStart: () => void;
}

export function Control(props: ControlProps): JSX.Element {
  if (props.recordingStatus === "Recording") {
    return (
      <div className="footer" style={{ display: "flex" }}>
        {/*<Button
          className={"big-button simple-label"}
          icon={<Pause />}
          large={true}
          fill={true}
          onClick={props.onPause}
          style={{ paddingRight: "2px" }}
        >
          Pause
    </Button>*/}
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
          Start Recording
        </Button>
      </div>
    );
  } else if (props.recordingStatus === "Paused") {
    return (
      <div className="footer" style={{ display: "flex" }}>
        <Button
          className={"big-button simple-label"}
          icon={<Stop />}
          large={true}
          fill={true}
          onClick={props.onStop}
          style={{ paddingRight: "2px" }}
        >
          Stop
        </Button>
        <Button
          className={"big-button simple-label"}
          icon={<Record />}
          large={true}
          fill={true}
          onClick={props.onStop}
          style={{ paddingLeft: "2px" }}
        >
          Resume
        </Button>
      </div>
    );
  }
}
