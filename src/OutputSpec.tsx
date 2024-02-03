import React, { useRef, useState, useEffect, useMemo } from "react";
import {
  Button,
  Checkbox,
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
import { ChevronDown, ChevronRight, Media } from "@blueprintjs/icons";

interface OutputSpecProps {
  outputFPS: number;
  outputDuration: number;
  outputSpec: OutputSpec;
  setOutputFPS: (fps: number) => void;
  setOutputDuration: (duration: number) => void;
  setOutputSpec: (spec: OutputSpec) => void;
  enableSavePictures: boolean;
  setEnableSavePictures: (value: boolean) => void;
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
        <div className="expansion-content">
          <div style={{ border: "solid 1px darkgrey", borderRadius: "3px" }}>
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
              <div
                style={{ padding: "1px 7px 7px 7px" }}
                className="radio-option"
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                  }}
                >
                  <div
                    style={
                      props.outputSpec === "FPS" ? {} : { color: "lightgrey" }
                    }
                  >
                    FPS (Frames Per Second)
                  </div>
                  <input
                    type="number"
                    className={
                      Classes.INPUT + (props.outputSpec === "FPS" ? "" : "dull")
                    }
                    placeholder={String(initialFPS)}
                    disabled={props.outputSpec !== "FPS"}
                    onChange={handleFpsChange}
                  />
                </div>
              </div>
            ) : (
              <div style={{ padding: "1px 7px 7px 7px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                  }}
                >
                  <div
                    style={
                      props.outputSpec === "Duration"
                        ? {}
                        : { color: "lightgrey" }
                    }
                  >
                    Output Duration (ms)
                  </div>
                  <input
                    type="number"
                    className={
                      Classes.INPUT +
                      (props.outputSpec === "Duration" ? "" : "dull")
                    }
                    placeholder={String(initialDuration)}
                    disabled={props.outputSpec !== "Duration"}
                    onChange={handleDurationChange}
                  />
                </div>
              </div>
            )}
          </div>
          <div style={{ paddingTop: "13px" }}>
            <Checkbox
              style={{
                display: "flex",
                alignItems: "center",
                marginLeft: "6px",
              }}
              checked={props.enableSavePictures}
              onChange={() => {
                props.setEnableSavePictures(!props.enableSavePictures);
              }}
            >
              <div style={{ display: "flex" }}>
                <div
                  style={{
                    color: "#5f6b7c",
                    marginTop: "-1px",
                    marginRight: "5px",
                  }}
                >
                  <Media></Media>
                </div>
                <div>Save images</div>
              </div>
            </Checkbox>
          </div>
        </div>
      ) : null}
    </>
  );
}
