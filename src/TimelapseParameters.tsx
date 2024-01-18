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

interface MainProps {
  timeLapseInterval: number;
  outputFPS: number;
  outputDuration: number;
  outputSpec: OutputSpec;
  setTimeLapseInterval: (interval: number) => void;
  setOutputFPS: (fps: number) => void;
  setOutputDuration: (duration: number) => void;
  setOutputSpec: (spec: OutputSpec) => void;
}

export function TimelapseParameters(props: MainProps): JSX.Element {
  const initialTimeLapseInterval = useMemo(() => props.timeLapseInterval, []);

  return (
    <div>
      <div className="complex-radio-group">
        <label className="radio-option">
          <Label style={{ marginBottom: "5px" }} htmlFor="time-between-frames">
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
