import { Button, Tab, Tabs, Tooltip } from "@blueprintjs/core";
import React, { useRef, useState, useEffect } from "react";

import { Record, Stop, Pause, Trash } from "@blueprintjs/icons";
import { RecordingStatus } from "../Types";

interface TimelapseControlProps {
  recordingStatus: RecordingStatus;
  onStop: () => void;
  onPause: () => void;
  onStart: () => void;
  onDiscard: () => void;
}

export function TimelapseControl(props: TimelapseControlProps): JSX.Element {
  if (props.recordingStatus === "Recording") {
    return (
      <>
        <div
          className={"overlay-button"}
          style={{
            bottom: "10px",
            right: "10px",
          }}
        >
          <Tooltip content="Pause recording">
            <Button
              className={"big-button simple-label"}
              icon={<Pause />}
              large={true}
              fill={true}
              onClick={props.onPause}
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
    return (
      <>
        <div
          className={"overlay-button"}
          style={{
            bottom: "10px",
            right: "10px",
          }}
        >
          <Tooltip content="Resume recording">
            <Button
              className={"big-button simple-label"}
              icon={<Record color="red" />}
              large={true}
              fill={true}
              onClick={props.onStart}
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
