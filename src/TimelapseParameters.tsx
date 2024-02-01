import { Classes, Divider, Label } from "@blueprintjs/core";
import React, { useState } from "react";
import { OutputSpec } from "./CameraPanel";
import "./Main.scss";
import { OutputSpecProps } from "./OutputSpec";
import { RecordingStatus } from "./App";

interface TimelapseParametersProps {
  timelapseInterval: number;
  outputFPS: number;
  outputDuration: number;
  outputSpec: OutputSpec;
  setTimelapseInterval: (interval: number) => void;
  setOutputFPS: (fps: number) => void;
  setOutputDuration: (duration: number) => void;
  setOutputSpec: (spec: OutputSpec) => void;
  recordingStatus: RecordingStatus;
  enableSavePictures: boolean;
  setEnableSavePictures: (value: boolean) => void;
}

export function TimelapseParameters(
  props: TimelapseParametersProps
): JSX.Element {
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
                placeholder={String(props.timelapseInterval)}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const newValue = Number(e.target.value);
                  props.setTimelapseInterval(
                    isNaN(newValue) || newValue <= 0
                      ? props.timelapseInterval
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
        enableSavePictures={props.enableSavePictures}
        setEnableSavePictures={props.setEnableSavePictures}
      />
    </div>
  );
}
