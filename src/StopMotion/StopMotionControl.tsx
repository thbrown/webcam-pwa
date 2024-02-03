import {
  Button,
  Spinner,
  Tab,
  Tabs,
  Tooltip,
  useHotkeys,
} from "@blueprintjs/core";
import React, { useRef, useState, useEffect, useMemo } from "react";

import { Record, Stop, Flash, Trash } from "@blueprintjs/icons";
import { RecordingStatus } from "../Types";

interface StopMotionControlProps {
  recordingStatus: RecordingStatus;
  onStart: () => void;
  onSnapshot: () => void;
  onStop: () => void;
  onDiscard: () => void;
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

  if (props.recordingStatus === "Recording") {
    return (
      <div
        className={"overlay-button"}
        style={{
          bottom: "15px",
          right: "15px",
        }}
      >
        <Spinner size={32} />
      </div>
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
            className={"big-button simple-label"}
            icon={<Record color="red" />}
            large={true}
            fill={true}
            onClick={props.onStart}
          ></Button>
        </Tooltip>
      </div>
    );
  } else if (props.recordingStatus === "Paused") {
    return (
      <>
        <div
          className={"overlay-button"}
          style={{
            bottom: "10px",
            right: "10px",
          }}
        >
          <Tooltip content="Record a frame">
            <Button
              className={"big-button simple-label"}
              icon={<Flash color="red" />}
              large={true}
              fill={true}
              onClick={props.onSnapshot}
            ></Button>
          </Tooltip>
        </div>
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
        <div
          className={"overlay-button"}
          style={{
            bottom: "10px",
            left: "10px",
          }}
        >
          <Tooltip content="Stop and discard recording">
            <Button
              className={"big-button simple-label"}
              icon={<Trash />}
              large={true}
              fill={true}
              onClick={props.onDiscard}
            ></Button>
          </Tooltip>
        </div>
      </>
    );
  }
}
