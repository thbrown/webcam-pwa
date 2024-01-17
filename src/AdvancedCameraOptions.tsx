import React, { useCallback, useEffect, useState } from "react";
import {
  Button,
  Collapse,
  Label,
  SegmentedControl,
  Slider,
  Spinner,
} from "@blueprintjs/core";
import { ChevronDown, ChevronRight } from "@blueprintjs/icons";
import { debounce } from "lodash";
import { CameraStatus } from "./CameraPanel";

interface AdvancedCameraOptionsProps {
  setCameraSettings: (value: React.SetStateAction<MediaTrackSettings>) => void;
  cameraStatus: CameraStatus;
  cameraSettings: MediaTrackSettings;
  activeTrack: MediaStreamTrack;
  supportedCameraCapabilities: MediaTrackCapabilities;
}

export const AdvancedCameraOptions = React.memo(
  (props: AdvancedCameraOptionsProps): JSX.Element => {
    try {
      const [areAdvancedOptionsEnabled, setAreAdvancedOptionsEnabled] =
        useState<boolean>(false);

      const handleToggleAdvancedOptions = () => {
        setAreAdvancedOptionsEnabled((prev) => !prev);
      };

      const clamp = (value: number, min: number, max: number): number => {
        return Math.min(Math.max(value, min), max);
      };

      const applySettingsChanges = useCallback(
        debounce(async (constraints: MediaTrackConstraints) => {
          // Maybe go to loading state here for the camera?
          try {
            await props.activeTrack.applyConstraints(constraints);
          } catch (e) {
            alert("NACHOS" + e);
          }
        }, 100),
        [props.activeTrack]
      );

      const handleAdvancedOptionStringChange = (
        value: string,
        settingsKey: keyof MediaTrackConstraintSet
      ): void => {
        console.log("Advanced Option Change (string)", value, settingsKey);
        const patch: MediaTrackConstraintSet = {};
        patch[settingsKey] = value;
        const constraints: MediaTrackConstraints = {
          advanced: [patch],
        };
        applySettingsChanges(constraints);
        props.setCameraSettings({
          ...props.cameraSettings,
          ...(patch as Partial<MediaTrackSettings>),
        });
      };

      const handleAdvancedOptionNumberChange = (
        value: number,
        settingsKey: keyof MediaTrackSettings
      ): void => {
        const patch: MediaTrackConstraintSet = {};
        patch[settingsKey as keyof MediaTrackConstraintSet] = value;
        const constraints: MediaTrackConstraints = {
          advanced: [patch],
        };
        applySettingsChanges(constraints);
        const reactStateUpdate = {} as MediaTrackSettings;
        //@ts-ignore
        reactStateUpdate[settingsKey] = value;
        console.log(
          "Constraints",
          constraints,
          reactStateUpdate,
          props.cameraSettings
        );

        props.setCameraSettings({
          ...props.cameraSettings,
          ...reactStateUpdate,
        });
        console.log("Advanced Option Change (number)", value, settingsKey, {
          ...props.cameraSettings,
          ...reactStateUpdate,
        });
      };

      const capabilitiesSort = (
        [keyA]: [
          keyof MediaTrackSettings,
          MediaTrackSettings[keyof MediaTrackSettings] | undefined
        ],
        [keyB]: [
          keyof MediaTrackSettings,
          MediaTrackSettings[keyof MediaTrackSettings] | undefined
        ]
      ): number => {
        const lowPriorityKeys: (keyof MediaTrackSettings)[] = [
          "height",
          "width",
          "aspectRatio",
        ];
        const indexA = lowPriorityKeys.indexOf(keyA);
        const indexB = lowPriorityKeys.indexOf(keyB);

        // Move keys found in the low priority list to the bottom
        if (indexA === -1) return -1;
        if (indexB === -1) return 1;

        return indexA - indexB;
      };

      const roundToShortReadable = (num: number): number => {
        const absNum = Math.abs(num);

        if (absNum >= 1) {
          const magnitude = Math.pow(10, Math.floor(Math.log10(absNum)));
          return (Math.round((num / magnitude) * 10) / 10) * magnitude;
        } else {
          const precision = Math.pow(10, Math.ceil(-Math.log10(absNum)) + 1);
          return Math.round(num * precision) / precision;
        }
      };
      const generateUIForCameraCapabilities = (
        capabilities: MediaTrackCapabilities | undefined,
        settings: MediaTrackSettings | undefined
      ): JSX.Element[] => {
        if (capabilities === undefined) {
          return [
            <div key={"only"} style={{ padding: "20px" }}>
              <Spinner size={64} />
            </div>,
          ];
        }
        return Object.entries(capabilities)
          .sort(capabilitiesSort)
          .map((capability, index) => {
            const [key, value] = capability;

            const renderSettingUI = () => {
              if (Array.isArray(value) && value.length > 1) {
                // Render radio buttons for arrays
                return (
                  <Label style={{ display: "flex" }}>
                    <div style={{ marginRight: "15px", width: "100%" }}>
                      {key}
                    </div>
                    <SegmentedControl
                      className="capability-input"
                      key={index}
                      inline
                      fill={true}
                      options={value.map((item) => ({
                        label: item.toString(),
                        value: item.toString(),
                      }))}
                      value={String(settings[key as keyof MediaTrackSettings])}
                      onValueChange={(v) =>
                        handleAdvancedOptionStringChange(
                          v,
                          key as keyof MediaTrackConstraintSet
                        )
                      }
                    />
                  </Label>
                );
              } else if (
                typeof value === "string" ||
                typeof value === "number" ||
                (Array.isArray(value) && value.length <= 1)
              ) {
                // We wont render anything for one option fields
              } else if (
                value !== null &&
                typeof value === "object" &&
                typeof value.min === "number" &&
                typeof value.max === "number" &&
                value.max > value.min
              ) {
                // Render slider for object with min, max, step properties
                const {
                  min,
                  max,
                  step = 1,
                } = value as { min: number; max: number; step?: number };
                const NUM_STEPS = 4;
                const calcLabelStepSize = (max - min) / NUM_STEPS;
                const shortStep = roundToShortReadable(step);
                return (
                  <Label style={{ display: "flex" }}>
                    <div style={{ marginRight: "15px", width: "100%" }}>
                      {key}
                    </div>
                    <Slider
                      max={max}
                      min={min}
                      stepSize={shortStep > 0 ? shortStep : (max - min) / 10}
                      onChange={(v) =>
                        handleAdvancedOptionNumberChange(
                          v,
                          key as keyof MediaTrackConstraintSet
                        )
                      }
                      value={clamp(
                        props.cameraSettings[
                          key as keyof MediaTrackSettings
                        ] as number,
                        min,
                        max
                      )}
                      labelStepSize={
                        calcLabelStepSize > 0 ? calcLabelStepSize : undefined
                      }
                    />
                  </Label>
                );
              } else if (typeof value === "object") {
                return (
                  <Label style={{ display: "flex" }}>
                    <div style={{ marginRight: "15px", width: "100%" }}>
                      {key}
                    </div>
                    <div>
                      Unsupported camera option object: {JSON.stringify(value)}
                    </div>
                  </Label>
                );
              } else {
                return (
                  <div>
                    Unsupported camera option: {value} {value}
                  </div>
                );
              }
            };

            return (
              <div
                key={index}
                style={{
                  padding: "0px 12px",
                }}
              >
                {renderSettingUI()}
              </div>
            );
          });
      };

      return (
        <>
          {props.cameraStatus === "initialized" ? (
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
              {areAdvancedOptionsEnabled ? "Hide" : "Show"} Advanced Options
            </Button>
          ) : null}
          {areAdvancedOptionsEnabled ? (
            Object.keys(props.supportedCameraCapabilities).length === 0 ? (
              <div style={{ padding: "10px" }}>
                <i>No advanced options available</i>
              </div>
            ) : (
              <div style={{ paddingTop: "10px" }}>
                {generateUIForCameraCapabilities(
                  props.supportedCameraCapabilities,
                  props.cameraSettings
                )}
              </div>
            )
          ) : null}
        </>
      );
    } catch (e) {
      console.warn("PRINT", e);
      alert("PIZZA" + e + " - " + e.stack);
    }
  }
);
