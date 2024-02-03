import { Button, Tooltip } from "@blueprintjs/core";
import React from "react";

import { Record, Stop, Trash } from "@blueprintjs/icons";
import { RecordingStatus } from "../Types";

interface SolarControlProps {
  recordingStatus: RecordingStatus;
  onStop: () => void;
  onStart: () => void;
}

export function SolarControl(props: SolarControlProps): JSX.Element {
  if (props.recordingStatus === "Recording") {
    return (
      <>
        <div
          className={"overlay-button"}
          style={{
            bottom: "60px",
            right: "10px",
          }}
        >
          <Tooltip content="Stop and save recording">
            <Button
              className={"big-button simple-label"}
              icon={<Stop />}
              large={true}
              fill={true}
              onClick={props.onStop}
            ></Button>
          </Tooltip>
        </div>
      </>
    );
  } else if (props.recordingStatus === "Stopped") {
    return (
      <div
        className={"overlay-button"}
        style={{
          bottom: "10px",
          right: "10px",
        }}
      >
        <Tooltip content="Start recording">
          <Button
            icon={<Record color="red" />}
            large={true}
            fill={true}
            onClick={props.onStart}
          ></Button>
        </Tooltip>
      </div>
    );
  } else if (props.recordingStatus === "Paused") {
    // Invalid state
    return <></>;
  }
}
