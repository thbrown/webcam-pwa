import React, { useRef, useState, useEffect, useMemo } from "react";
import {
  Button,
  Classes,
  Collapse,
  Label,
  Radio,
  RadioGroup,
  SegmentedControl,
  Slider,
  Spinner,
} from "@blueprintjs/core";

import { OutputSpec } from "./CameraPanel";
import { ChevronDown, ChevronRight } from "@blueprintjs/icons";

interface OutputSpecProps {
  outputFPS: number;
  outputDuration: number;
  outputSpec: OutputSpec;
  setOutputFPS: (fps: number) => void;
  setOutputDuration: (duration: number) => void;
  setOutputSpec: (spec: OutputSpec) => void;
}

export function OutputSpecProps(props: OutputSpecProps): JSX.Element {
  const initialDuration = useMemo(() => props.outputDuration, []);
  const initialFPS = useMemo(() => props.outputFPS, []);

  const [areOutputOptionsEnabled, setAreOutputOptionsEnabled] =
    useState<boolean>(false);

  const handleToggleOutputOptions = () => {
    setAreOutputOptionsEnabled((prev) => !prev);
  };

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
    <>
      <div className={"expansion-button-container"}>
        <Button
          icon={areOutputOptionsEnabled ? <ChevronDown /> : <ChevronRight />}
          alignText={"left"}
          onClick={handleToggleOutputOptions}
          fill={true}
          outlined={false}
          minimal={true}
          className={"expansion-button"}
        >
          {areOutputOptionsEnabled ? "Hide" : "Show"} Output Options
        </Button>
      </div>
      {areOutputOptionsEnabled ? (
        <>
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
              <div
                style={props.outputSpec === "FPS" ? {} : { color: "lightgrey" }}
              >
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
        </>
      ) : null}
    </>
  );
}
