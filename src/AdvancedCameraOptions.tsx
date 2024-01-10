import React, { useState } from "react";
import {
  Button,
  Collapse,
  Label,
  SegmentedControl,
  Slider,
  Spinner,
} from "@blueprintjs/core";
import { ChevronDown, ChevronRight } from "@blueprintjs/icons";
import { CameraCapabilities, CameraSettings } from "./CameraPanel";

interface AdvancedCameraOptionsProps {
  setCameraSettings: (value: React.SetStateAction<CameraSettings>) => void;
  cameraPermission: PermissionState;
  cameraSettings: CameraSettings;
  activeTrack: MediaStreamTrack;
  supportedCameraCapabilities: CameraCapabilities;
}

export function AdvancedCameraOptions(
  props: AdvancedCameraOptionsProps
): JSX.Element {
  try {
    const [areAdvancedOptionsEnabled, setAreAdvancedOptionsEnabled] =
      useState<boolean>(false);

    const handleToggleAdvancedOptions = () => {
      setAreAdvancedOptionsEnabled(!areAdvancedOptionsEnabled);
    };

    const clamp = (value: number, min: number, max: number): number => {
      return Math.min(Math.max(value, min), max);
    };

    const handleAdvancedOptionChange = (
      value: string | number,
      settingsKey: keyof MediaTrackConstraintSet
    ): void => {
      console.log("Advanced Option Change", value, settingsKey);
      const patch: MediaTrackConstraintSet = {};
      patch[settingsKey] = value;
      const constraints: MediaTrackConstraints = {
        advanced: [patch],
      };
      props.activeTrack.applyConstraints(constraints);
      props.setCameraSettings({
        ...props.cameraSettings,
        ...(patch as Partial<CameraSettings>),
      });
    };

    const generateUIForCameraCapabilities = (
      capabilities: CameraCapabilities | undefined,
      settings: CameraSettings | undefined
    ): JSX.Element[] => {
      if (capabilities === undefined) {
        return [
          <div key={"only"} style={{ padding: "20px" }}>
            <Spinner size={64} />
          </div>,
        ];
      }
      console.log("rendering capabilities", capabilities);
      return [<div>JSON.stringify(capabilities, null, 2)</div>];
      return Object.entries(capabilities).map((capability, index) => {
        const [key, value] = capability;

        const renderSettingUI = () => {
          if (Array.isArray(value)) {
            // Render radio buttons for arrays
            return (
              <Label style={{ display: "flex" }}>
                <div style={{ marginRight: "15px", width: "100%" }}>{key}</div>
                <SegmentedControl
                  className="capability-input"
                  key={index}
                  inline
                  fill={true}
                  options={value.map((item) => ({
                    label: item.toString(),
                    value: item.toString(),
                  }))}
                  value={String(settings[key])}
                  onValueChange={(v) =>
                    handleAdvancedOptionChange(
                      v,
                      key as keyof MediaTrackConstraintSet
                    )
                  }
                />
              </Label>
            );
          } else if (typeof value === "string" || typeof value === "number") {
            // We wont render anything for these, there is only one option
          } else if (
            typeof value === "object" &&
            value !== null &&
            typeof value.min === "number" &&
            typeof value.max === "number"
          ) {
            // Render slider for object with min, max, step properties
            const {
              min,
              max,
              step = 1,
            } = value as { min: number; max: number; step?: number };
            const NUM_STEPS = 4;
            const calcStepSize = (max - min) / NUM_STEPS;
            return (
              <Label style={{ display: "flex" }}>
                <div style={{ marginRight: "15px", width: "100%" }}>{key}</div>
                <Slider
                  key={index}
                  min={min}
                  max={max}
                  stepSize={Math.round(step)}
                  value={clamp(parseInt(String(settings[key])), min, max)}
                  labelStepSize={calcStepSize}
                  onChange={(v) =>
                    handleAdvancedOptionChange(
                      v,
                      key as keyof MediaTrackConstraintSet
                    )
                  }
                />
              </Label>
            );
          } else {
            alert("Unsupported camera setting " + typeof value + " " + value);
          }
        };

        return (
          <div
            key={index}
            style={{
              padding: "0px 30px",
            }}
          >
            {renderSettingUI()}
          </div>
        );
      });
    };

    return (
      <>
        {props.cameraPermission === "granted" ? (
          <Button
            icon={
              areAdvancedOptionsEnabled ? <ChevronDown /> : <ChevronRight />
            }
            alignText={"left"}
            onClick={handleToggleAdvancedOptions}
            fill={true}
            outlined={false}
            style={{ marginBottom: "5px" }}
            minimal={true}
          >
            {areAdvancedOptionsEnabled ? "Hide" : "Show"} advanced options
          </Button>
        ) : null}
        {areAdvancedOptionsEnabled
          ? generateUIForCameraCapabilities(
              props.supportedCameraCapabilities,
              props.cameraSettings
            )
          : null}
      </>
    );
  } catch (e) {
    console.log(e);
    alert(e + " - " + e.stack);
  }
}

/*

        <Collapse isOpen={areAdvancedOptionsEnabled}>
          <div
            style={{
              height: "25vh",
              overflow: "auto",
              background: "#2d72d212", //lightblue
              paddingTop: "10px",
              borderRadius: "3px",
            }}
          >
            {areAdvancedOptionsEnabled
              ? generateUIForCameraCapabilities(
                  props.supportedCameraCapabilities,
                  props.cameraSettings
                )
              : null}
          </div>
        </Collapse>
        */
