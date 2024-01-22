import {
  Classes,
  Divider,
  Label,
  Radio,
  RadioGroup,
  Tab,
  Tabs,
} from "@blueprintjs/core";
import React, { useRef, useState, useEffect, useMemo } from "react";
import { OutputSpec } from "./CameraPanel";
import { RecordingsPanel } from "./RecordingsPanel";
import { FolderOpen, Camera } from "@blueprintjs/icons";
import "./Main.scss";
import { OutputSpecProps } from "./OutputSpec";
import { RecordingStatus } from "./App";

interface StopMotionParametersProps {
  outputFPS: number;
  outputDuration: number;
  outputSpec: OutputSpec;
  setOutputFPS: (fps: number) => void;
  setOutputDuration: (duration: number) => void;
  setOutputSpec: (spec: OutputSpec) => void;
  recordingStatus: RecordingStatus;
}

export function StopMotionParameters(
  props: StopMotionParametersProps
): JSX.Element {
  return (
    <>
      {props.recordingStatus === "Stopped" ? (
        <>
          <div className="mode-description">
            <b>Stop Motion</b> Capture moments on demand. Press the button, take
            a frame. Build your story frame by frame with Stop Motion mode.
          </div>
          <Divider></Divider>
        </>
      ) : null}
      <div>
        <OutputSpecProps
          outputFPS={props.outputFPS}
          outputDuration={props.outputDuration}
          outputSpec={props.outputSpec}
          setOutputFPS={props.setOutputFPS}
          setOutputDuration={props.setOutputDuration}
          setOutputSpec={props.setOutputSpec}
        />
      </div>
    </>
  );
}
