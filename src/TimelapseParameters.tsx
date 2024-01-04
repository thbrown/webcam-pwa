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
import { CameraPanel, OutputSpec } from "./CameraPanel";
import { RecordingsPanel } from "./RecordingsPanel";
import { FolderOpen, Camera } from "@blueprintjs/icons";
import "./Main.scss";

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
  const initialDuration = useMemo(() => props.outputDuration, []);
  const initialFPS = useMemo(() => props.outputFPS, []);

  const handleFpsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    props.setOutputFPS(
      isNaN(newValue) || newValue <= 0 ? initialFPS : newValue
    );
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    props.setOutputDuration(
      isNaN(newValue) || newValue <= 0 ? initialDuration : newValue
    );
  };

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
      <RadioGroup
        selectedValue={props.outputSpec}
        onChange={(e: React.FormEvent<HTMLInputElement>): void => {
          props.setOutputSpec(e.currentTarget.value as OutputSpec);
        }}
        className="complex-radio-group"
        inline={true}
      >
        <Radio label="Output FPS" value="FPS" />
        <Radio label="Output Duration (ms)" value="Duration" />
      </RadioGroup>

      {props.outputSpec === "FPS" ? (
        <div style={{ padding: "7px" }} className="radio-option">
          <div style={props.outputSpec === "FPS" ? {} : { color: "lightgrey" }}>
            FPS (Frames Per Second)
          </div>
          <input
            type="number"
            className={
              Classes.INPUT +
              " radio-input " +
              (props.outputSpec === "FPS" ? "" : "dull")
            }
            placeholder={String(initialFPS)}
            disabled={props.outputSpec !== "FPS"}
            onChange={handleFpsChange}
          />
        </div>
      ) : (
        <div style={{ padding: "7px" }} className="radio-option">
          <div
            style={
              props.outputSpec === "Duration" ? {} : { color: "lightgrey" }
            }
          >
            Output Duration (ms)
          </div>
          <input
            type="number"
            className={
              Classes.INPUT +
              " radio-input " +
              (props.outputSpec === "Duration" ? "" : "dull")
            }
            placeholder={String(initialDuration)}
            disabled={props.outputSpec !== "Duration"}
            onChange={handleDurationChange}
          />
        </div>
      )}
    </div>
  );
}
// https://gml.noaa.gov/grad/solcalc/table.php?lat=39.74&lon=-104.99&year=2024
