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

interface TimelapseParametersProps {
  timeLapseInterval: number;
  outputFPS: number;
  outputDuration: number;
  outputSpec: OutputSpec;
  setTimeLapseInterval: (interval: number) => void;
  setOutputFPS: (fps: number) => void;
  setOutputDuration: (duration: number) => void;
  setOutputSpec: (spec: OutputSpec) => void;
  recordingStatus: RecordingStatus;
}

export function TimelapseParameters(
  props: TimelapseParametersProps
): JSX.Element {
  const initialTimeLapseInterval = useMemo(() => props.timeLapseInterval, []);

  return (
    <div>
      {props.recordingStatus === "Stopped" ? (
        <>
          <div className="mode-description">
            <b>Timelapse</b> Set the frame frequency to control the pace of your
            video in Timelapse mode. Customize how time unfolds with your chosen
            intervals.
          </div>
          <Divider></Divider>
        </>
      ) : null}
      {props.recordingStatus === "Stopped" ||
      props.recordingStatus === "Paused" ? (
        <>
          <div className="complex-radio-group">
            <label className="radio-option">
              <Label
                style={{ marginBottom: "5px" }}
                htmlFor="time-between-frames"
              >
                Time Between Frames (ms)
              </Label>
              <input
                type="number"
                id="time-between-frames"
                className={Classes.INPUT}
                placeholder={String(initialTimeLapseInterval)}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const newValue = Number(e.target.value);
                  props.setTimeLapseInterval(
                    isNaN(newValue) || newValue <= 0
                      ? initialTimeLapseInterval
                      : newValue
                  );
                }}
              />
            </label>
          </div>
        </>
      ) : null}
      <Divider></Divider>
      <OutputSpecProps
        outputFPS={props.outputFPS}
        outputDuration={props.outputDuration}
        outputSpec={props.outputSpec}
        setOutputFPS={props.setOutputFPS}
        setOutputDuration={props.setOutputDuration}
        setOutputSpec={props.setOutputSpec}
      />
    </div>
  );
}
// https://gml.noaa.gov/grad/solcalc/table.php?lat=39.74&lon=-104.99&year=2024
