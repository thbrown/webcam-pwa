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

interface WebcamTimelapseProps {
  timeLapseInterval: number;
  outputFPS: number;
  outputDuration: number;
  outputSpec: OutputSpec;
  setTimeLapseInterval: (interval: number) => void;
  setOutputFPS: (fps: number) => void;
  setOutputDuration: (duration: number) => void;
  setOutputSpec: (spec: OutputSpec) => void;
}

export function TimelapseParameters(props: WebcamTimelapseProps): JSX.Element {
  const initialTimeLapseInterval = useMemo(() => props.timeLapseInterval, []);
  const initialDuration = useMemo(() => props.outputDuration, []);
  const initialFPS = useMemo(() => props.outputFPS, []);
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
      <Divider style={{ marginTop: "-1px" }} />
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

      <div style={{ padding: "7px" }} className="radio-option">
        <div style={props.outputSpec === "FPS" ? {} : { color: "lightgrey" }}>
          FPS
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
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = Number(e.target.value);
            props.setTimeLapseInterval(
              isNaN(newValue) || newValue <= 0 ? initialFPS : newValue
            );
          }}
        />
      </div>
      <div style={{ padding: "7px" }} className="radio-option">
        <div
          style={props.outputSpec === "Duration" ? {} : { color: "lightgrey" }}
        >
          DURATION
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
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = Number(e.target.value);
            props.setTimeLapseInterval(
              isNaN(newValue) || newValue <= 0 ? initialDuration : newValue
            );
          }}
        />
      </div>
      <Divider style={{ marginTop: "-1px" }} />
    </div>
  );
}
// https://gml.noaa.gov/grad/solcalc/table.php?lat=39.74&lon=-104.99&year=2024
